import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(req: NextRequest) {
  const { to, message } = await req.json()

  if (!to || !message) {
    return NextResponse.json(
      { error: 'Recipient and message required' },
      { status: 400 }
    )
  }

  try {
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: message
    })

    return NextResponse.json({
      success: true,
      sid: result.sid,
      status: result.status
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
