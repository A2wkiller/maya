import { NextResponse } from 'next/server'
import { isConfigured } from '@/lib/config'

export async function GET() {
  return NextResponse.json({
    status: 'MAYA V2 Online',
    version: '2.0.0',
    services: {
      gemini: isConfigured.gemini ? 'connected' : 'missing key',
      groq: isConfigured.groq ? 'connected' : 'missing key',
      supabase: isConfigured.supabase ? 'connected' : 'missing key',
      twilio: isConfigured.twilio ? 'connected' : 'not configured',
      google: isConfigured.google ? 'connected' : 'not configured',
      tavily: isConfigured.tavily ? 'connected' : 'not configured',
      nvidia: isConfigured.nvidia ? 'connected' : 'not configured',
    },
    required: {
      ready: isConfigured.gemini && isConfigured.supabase,
      missing: [
        !isConfigured.gemini && 'GEMINI_API_KEY',
        !isConfigured.supabase && 'SUPABASE credentials',
      ].filter(Boolean)
    },
    timestamp: new Date().toISOString()
  })
}
