# MAYA V2 — Setup Guide

## Required (app won't work without these)

### 1. Gemini API Key
- Go to: https://aistudio.google.com/app/apikey
- Sign in with Google
- Click "Create API Key"
- Copy and paste into .env.local as NEXT_PUBLIC_GEMINI_API_KEY

### 2. Supabase Database
- Go to: https://supabase.com
- Click "New Project"
- Name: maya-v2, Region: South Asia
- Go to Settings → API
- Copy "Project URL" → NEXT_PUBLIC_SUPABASE_URL
- Copy "anon public" key → NEXT_PUBLIC_SUPABASE_ANON_KEY
- Go to SQL Editor → run the database setup queries

### 3. Database Setup (run in Supabase SQL Editor)
Copy and run the SQL from Process 2 to create all tables.

## Optional (add when ready)

### Groq (free fallback AI)
- Go to: https://console.groq.com
- Sign up free → API Keys → Create Key
- Paste into GROQ_API_KEY

### NVIDIA (Nemotron planning)
- Go to: https://build.nvidia.com
- Sign in → API Keys → copy key
- Paste into NVIDIA_API_KEY

### WhatsApp (Twilio)
- Go to: https://twilio.com/console
- Sign up → Get trial number
- Copy Account SID and Auth Token

### Gmail
- Go to: https://console.cloud.google.com
- New project → Enable Gmail API
- Credentials → OAuth 2.0 → Download JSON

### Research (Tavily)
- Go to: https://tavily.com
- Sign up free → API Keys

## Running the app

npm run dev

## Check service status
Visit: http://localhost:3000/api/status
