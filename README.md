# MAYA — Personal AI OS

An open-source personal AI operating system built with
Next.js, Electron, and multiple AI providers.

## Features
- AI conversation with Gemini + Groq
- Voice input via Whisper API
- Kokoro TTS — free local voice (no API key)
- Screen share + camera vision
- Always listening wake word
- Native Windows computer control
- Browser automation with Playwright
- Business intelligence agents
- Persistent memory via Supabase
- Streaming responses
- Hindi / Hinglish support

## Quick Start

### 1. Clone
```bash
git clone https://github.com/YOUR_USERNAME/maya-v2.git
cd maya-v2
```

### 2. Install
```bash
npm install
cd python && pip install -r requirements.txt && cd ..
```

### 3. Configure
```bash
cp .env.example .env.local
# Edit .env.local and add your API keys
```

### 4. Run
```bash
npm run electron:dev
```

## Getting API Keys
- Gemini: https://aistudio.google.com (free)
- Groq: https://console.groq.com (free)
- Supabase: https://supabase.com (free 500MB)

## First Time Setup
When you first open MAYA:
1. Enter your name
2. Tell MAYA about yourself
3. MAYA learns and personalizes over time

## Tech Stack
- Frontend: Next.js 15 + TypeScript + Electron
- AI: Google Gemini 2.5 Flash + Groq Llama 4
- Voice: Groq Whisper + Kokoro TTS (local)
- Database: Supabase (PostgreSQL)
- Automation: Playwright + PyAutoGUI

## License
MIT
