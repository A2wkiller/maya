import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    enabled: false,
    message: 'Calendar integration coming soon.'
  })
}
