import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'
import { saveSummary, getSummaries } from '@/lib/supabase'

export async function GET() {
  const data = await getSummaries(10)
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { conversationHistory, language } = await req.json()

  if (!conversationHistory?.length) {
    return NextResponse.json(
      { error: 'No conversation to summarize' },
      { status: 400 }
    )
  }

  const transcript = conversationHistory.map((m: any, i: number) =>
    `[${i + 1}] User: ${m.question}\nMAYA: ${m.reply}`
  ).join('\n\n')

  const reply = await callGemini({
    systemPrompt: `You are MAYA summarizing a session for the user.
Write a clean summary in plain text. No markdown ever.
Structure: what was covered, key things learned or decided,
follow-ups needed, tasks mentioned.
Write like a smart friend summarizing the session.
Keep it concise but complete.`,
    question: `Summarize this conversation:\n\n${transcript}`,
    temperature: 0.5,
    maxTokens: 400
  })

  await saveSummary(reply, conversationHistory.length)

  return NextResponse.json({ reply })
}
