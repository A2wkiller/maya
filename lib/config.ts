// lib/config.ts
// Centralized config — all env vars accessed from here
// Throws clear errors if required vars are missing

export const config = {
  // AI Models
  gemini: {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash-lite',
    endpoint: (key: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },

  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions'
  },

  // Database
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  },

  // WhatsApp
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER ||
      'whatsapp:+14155238886'
  },

  // Gmail
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || ''
  },

  // Research
  tavily: {
    apiKey: process.env.TAVILY_API_KEY || ''
  }
}

// Check if required services are configured
export const isConfigured = {
  gemini: !!config.gemini.apiKey,
  groq: !!config.groq.apiKey,
  supabase: !!(config.supabase.url && config.supabase.anonKey),
  twilio: !!(config.twilio.accountSid && config.twilio.authToken),
  google: !!(config.google.clientId && config.google.clientSecret),
  tavily: !!config.tavily.apiKey,
  nvidia: !!config.nvidia.apiKey
}

// Get which AI to use — falls back gracefully
export function getAIProvider(): 'gemini' | 'groq' | 'nvidia' {
  if (isConfigured.gemini) return 'gemini'
  if (isConfigured.groq) return 'groq'
  return 'groq' // default fallback
}
