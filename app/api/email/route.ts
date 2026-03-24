import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    enabled: false,
    message: 'Email integration coming soon.'
  })
}
