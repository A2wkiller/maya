import { KEYS } from './keys'

export async function callGemini(params: {
  systemPrompt: string
  question: string
  base64Image?: string | null
  extraFrames?: string[]
  temperature?: number
  maxTokens?: number
}): Promise<string> {
  const {
    systemPrompt,
    question,
    base64Image,
    extraFrames = [],
    temperature = 0.75,
    maxTokens = 200
  } = params

  if (!KEYS.gemini) {
    return callWithBestModel(params)
  }

  const parts: any[] = []

  extraFrames.slice(-2).forEach(frame => {
    parts.push({
      inline_data: { mime_type: 'image/jpeg', data: frame }
    })
  })

  if (base64Image) {
    parts.push({
      inline_data: { mime_type: 'image/jpeg', data: base64Image }
    })
  }

  parts.push({ text: question })

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${KEYS.gemini}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [{ parts }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 0.9
          }
        })
      }
    )

    const data = await res.json()

    if (data.error) {
      console.error('Gemini error:', data.error.message)
      return callTextFallbackChain(systemPrompt, question)
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  } catch (err) {
    console.error('Gemini fetch failed:', err)
    return callTextFallbackChain(systemPrompt, question)
  }
}

export async function callWithBestModel(params: {
  systemPrompt: string
  question: string
  base64Image?: string | null
  extraFrames?: string[]
  temperature?: number
  maxTokens?: number
}): Promise<string> {

  // 1st choice — Gemini (vision support)
  if (KEYS.gemini) {
    return callGemini(params)
  }

  // 2nd choice — NVIDIA Nemotron (text only)
  if (KEYS.nvidia) {
    return callNvidia(params.systemPrompt, params.question)
  }

  // 3rd choice — OpenRouter (text only)
  if (KEYS.openrouter) {
    return callOpenRouter(params.systemPrompt, params.question)
  }

  // 4th choice — Groq (text only, free)
  if (KEYS.groq) {
    return callGroqFallback(params.systemPrompt, params.question)
  }

  return 'No AI keys configured Boss.'
}

async function callTextFallbackChain(
  systemPrompt: string,
  question: string
): Promise<string> {
  if (KEYS.nvidia) {
    return callNvidia(systemPrompt, question)
  }

  if (KEYS.openrouter) {
    return callOpenRouter(systemPrompt, question)
  }

  if (KEYS.groq) {
    return callGroqFallback(systemPrompt, question)
  }

  return 'No AI keys configured Boss.'
}

async function callNvidia(
  systemPrompt: string,
  question: string
): Promise<string> {
  try {
    const res = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEYS.nvidia}`
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-super-120b-a12b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      }
    )
    const data = await res.json()
    return data.choices?.[0]?.message?.content ||
      callGroqFallback(systemPrompt, question)
  } catch (err) {
    return callGroqFallback(systemPrompt, question)
  }
}

async function callOpenRouter(
  systemPrompt: string,
  question: string
): Promise<string> {
  try {
    const res = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEYS.openrouter}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MAYA Personal AI'
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-vl-72b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      }
    )
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (err) {
    return ''
  }
}

export async function callGroqFallback(
  systemPrompt: string,
  question: string
): Promise<string> {
  if (!KEYS.groq) {
    return 'MAYA is offline Boss. Add your API key to get started.'
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEYS.groq}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 200,
        temperature: 0.75
      })
    })

    const data = await res.json()
    return data.choices?.[0]?.message?.content ||
      'Having trouble connecting Boss.'

  } catch (err) {
    return 'Connection failed Boss. Check your internet.'
  }
}

export function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/[#*_~|]/g, '')
    .trim()
}
