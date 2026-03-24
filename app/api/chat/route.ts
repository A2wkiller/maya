import { NextRequest, NextResponse } from 'next/server'
import {
  detectIntent,
  detectMood,
  needsVisual,
  shouldSaveMemory,
  shouldSaveTask,
  buildSystemPrompt,
  buildPersonaFromProfile
} from '@/lib/maya-brain'
import { callGemini } from '@/lib/gemini'
import { KEYS } from '@/lib/keys'
import { saveMessage, saveMemory, saveTask } from '@/lib/supabase'

export const runtime = 'nodejs'

function detectComputerAction(question: string) {
  const lower = question.toLowerCase()
  let computerAction: any = null

  // YouTube search — very broad detection
  if (
    lower.includes('youtube') ||
    (lower.includes('search') && lower.includes('video')) ||
    (lower.includes('find') && lower.includes('video')) ||
    (lower.includes('watch') && !lower.includes('watch this'))
  ) {
    const q = question
      .replace(/search|find|look up|watch|on youtube|in youtube|youtube|video about|show me/gi, '')
      .trim()
    if (q.length > 1) {
      computerAction = { type: 'youtube_search', query: q }
    }
  }

  // Play first YouTube result
  else if (lower === 'play first' || lower === 'play the first one' ||
           lower.includes('play first result')) {
    computerAction = { type: 'browser_action', action: 'play_first' }
  }

  // Google search
  else if (
    lower.includes('google') ||
    (lower.includes('search') && !lower.includes('youtube'))
  ) {
    const q = question
      .replace(/search|google|look up|find|for me/gi, '')
      .trim()
    if (q.length > 1) {
      computerAction = { type: 'google_search', query: q }
    }
  }

  // Open websites or apps
  else if (lower.startsWith('open ') || lower.includes('go to ')) {
    const target = question
      .replace(/^open |^go to |^launch /i, '').trim().toLowerCase()

    const websites = ['youtube', 'google', 'gmail', 'instagram',
      'twitter', 'github', 'netflix', 'spotify', 'whatsapp',
      'linkedin', 'reddit', 'amazon', 'flipkart']

    const isWebsite = websites.some(w => target.includes(w))

    if (isWebsite) {
      computerAction = { type: 'open_site', site: target }
    } else {
      computerAction = { type: 'open_app', app: target }
    }
  }

  // Volume
  else if (lower.includes('volume up') || lower.includes('louder'))
    computerAction = { type: 'volume', action: 'up' }
  else if (lower.includes('volume down') || lower.includes('quieter'))
    computerAction = { type: 'volume', action: 'down' }
  else if (lower.includes('mute'))
    computerAction = { type: 'volume', action: 'mute' }

  // Scroll
  else if (lower.includes('scroll down'))
    computerAction = { type: 'browser_action', action: 'scroll_down' }
  else if (lower.includes('scroll up'))
    computerAction = { type: 'browser_action', action: 'scroll_up' }

  // Go back
  else if (lower === 'go back' || lower === 'back')
    computerAction = { type: 'browser_action', action: 'back' }

  // Type something
  else if (lower.startsWith('type ')) {
    computerAction = {
      type: 'type',
      text: question.replace(/^type /i, '').trim()
    }
  }

  // Screenshot
  else if (lower.includes('screenshot'))
    computerAction = { type: 'screenshot' }

  // System info
  else if (lower.includes('cpu') || lower.includes('ram') ||
           lower.includes('memory') || lower.includes('system info'))
    computerAction = { type: 'sysinfo' }

  return computerAction
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  try {
    const {
      question,
      base64Image,
      extraFrames = [],
      language = 'en',
      isScreenSharing = false,
      conversationHistory = [],
      profile = null
    } = await req.json()

    if (!question?.trim()) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const agent = detectIntent(question)
    const mood = detectMood(question)
    const useImage = needsVisual(question) && !!base64Image
    const computerAction = detectComputerAction(question)
    const persona = buildPersonaFromProfile(profile)

    const systemPrompt = buildSystemPrompt(
      language,
      agent,
      mood,
      useImage,
      isScreenSharing,
      extraFrames.length,
      persona
    )

    // ── GROQ FAST PATH (text only) ───────────────────
    if (!useImage && KEYS.groq) {
      try {
        const groqRes = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${KEYS.groq}`
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-4-scout-17b-16e-instruct',
              messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.slice(-6).flatMap((m: any) => [
                  { role: 'user', content: m.question },
                  { role: 'assistant', content: m.reply }
                ]),
                { role: 'user', content: question }
              ],
              max_tokens: 80,
              temperature: 0.8,
              stream: true
            })
          }
        )

        if (!groqRes.body) throw new Error('No Groq stream')

        const stream = new ReadableStream({
          async start(controller) {
            const reader = groqRes.body!.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              for (const line of chunk.split('\n')) {
                if (!line.startsWith('data: ')) continue
                const payload = line.slice(6)
                if (payload.includes('[DONE]')) continue
                try {
                  const data = JSON.parse(payload)
                  const text = data.choices?.[0]?.delta?.content
                  if (text) {
                    fullText += text
                    controller.enqueue(
                      encoder.encode(`event: token\ndata: ${JSON.stringify({ content: text })}\n\n`)
                    )
                  }
                } catch (err) {
                  console.error('Groq parse error:', err)
                }
              }
            }

            await saveMessage({
              question,
              reply: fullText,
              agent,
              language,
              has_image: false
            })

            controller.enqueue(
              encoder.encode(`event: done\ndata: ${JSON.stringify({ agent, mood, usedImage: false, computerAction })}\n\n`)
            )
            controller.close()
          }
        })

        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
          }
        })
      } catch (err) {
        console.error('Groq fast path failed, falling back to Gemini:', err)
      }
    }

    // ── GEMINI PATH (vision or fallback) ─────────────
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        }

        try {
          send('status', { agent, mood, usedImage: useImage })

          const reply = await callGemini({
            systemPrompt,
            question,
            base64Image: useImage ? base64Image : null,
            extraFrames: useImage ? extraFrames : [],
            temperature: isScreenSharing ? 0.2 : 0.8,
            maxTokens: isScreenSharing ? 150 : 80
          })

          const words = reply.split(/\s+/)
          let buffer = ''
          for (let i = 0; i < words.length; i++) {
            buffer += (buffer ? ' ' : '') + words[i]
            if (buffer.length > 30 || i === words.length - 1) {
              send('token', { content: buffer })
              buffer = ''
            }
          }

          send('done', { agent, mood, usedImage: useImage, computerAction })

          // Persist after stream finishes
          await saveMessage({
            question,
            reply,
            agent,
            language,
            has_image: useImage
          })

          if (shouldSaveMemory(question)) {
            await saveMemory(`${question} -> ${reply}`, agent, agent)
          }

          if (shouldSaveTask(question)) {
            await saveTask({ title: question, priority: 'medium', agent })
          }

        } catch (error: any) {
          console.error('Chat stream error:', error)
          send('error', { message: error?.message || 'Internal error' })
        } finally {
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
