// lib/keys.ts
// MAYA Personal AI OS - Configuration
// Copy this file, rename to keys.local.ts and add your keys
// keys.local.ts is in .gitignore - never committed

export const KEYS = {
  // Get from: aistudio.google.com/app/apikey
  gemini: process.env.NEXT_PUBLIC_GEMINI_KEY || '',

  // Get from: console.groq.com (free)
  groq: process.env.NEXT_PUBLIC_GROQ_KEY || '',

  // Optional - NVIDIA (text fallback)
  nvidia: process.env.NEXT_PUBLIC_NVIDIA_KEY || '',

  // Optional - OpenRouter (text fallback)
  openrouter: process.env.NEXT_PUBLIC_OPENROUTER_KEY || '',

  // Get from: supabase.com (free 500MB)
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON || '',

  // Optional - elevenlabs.io
  elevenlabs: process.env.NEXT_PUBLIC_ELEVENLABS_KEY || '',
}

export const FEATURES = {
  ai: true,
  database: true,
  voice: true,
  computerControl: true,
}
