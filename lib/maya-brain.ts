import { AgentType, Language, Mood } from '@/types'

// PERSONA
export const MAYA_PERSONA = `You are MAYA, the user's personal AI OS and closest friend.
Talk casual, warm, direct like texting a close friend.
No markdown. No formal language. Short replies unless detail is needed.
Call them Boss sometimes. Never say "As an AI".`

export function buildPersonaFromProfile(profile: any): string {
  if (!profile) return MAYA_PERSONA

  return `You are MAYA, ${profile.name || 'the user'}'s personal AI OS.
Talk like their closest friend. Casual, warm, direct.
No markdown. No formal language. Short replies unless detail needed.
User info:
- Name: ${profile.name || 'Unknown'}
- Occupation: ${profile.occupation || 'Unknown'}
- Interests: ${profile.interests?.join(', ') || 'Unknown'}
- Projects/Businesses: ${profile.businesses || 'None'}
- Goals: ${profile.goals || 'None'}
- Language: ${profile.language === 'hi' ? 'Hinglish preferred' : 'English'}
Address them by name occasionally. Remember their context always.`
}

// MOOD INSTRUCTIONS
export const MOOD_INSTRUCTIONS: Record<Mood, string> = {
  neutral: 'Talk normally — friendly, casual, sharp.',
  stressed: 'Be calm. Say something like "alright lets sort this" then help.',
  frustrated: 'Acknowledge briefly — "yeah thats annoying" — then fix it fast.',
  excited: 'Match their energy naturally. Be happy for them.',
  confused: 'Explain simply. Short sentences. Easy steps.',
}

// AGENT INSTRUCTIONS
export const AGENT_INSTRUCTIONS: Record<AgentType, string> = {
  vision: 'Analyze what you see in the camera or screen. Be specific.',
  email: 'You are handling email tasks. Read, summarize, draft replies professionally.',
  whatsapp: 'You are sending messages. Always confirm before sending.',
  calendar: 'You are managing schedule. Parse dates and times carefully.',
  research: 'You are researching. Give accurate, sourced, summarized information.',
  college: `You are helping with studies and coursework.
    Be a great tutor with clear explanations and real examples.`,
  game: `You are helping with game development.
    Offer practical Unity/Unreal/engine-agnostic guidance and creative ideas.`,
  healthcare: `You are helping with healthcare or medtech research and product planning.
    Consider regulations, ethics, and patient safety.`,
  general: 'Answer the question naturally like a smart friend.',
}

// INTENT DETECTION
export function detectIntent(question: string): AgentType {
  const lower = question.toLowerCase()

  // Code requests — handle directly, never route away
  if (lower.includes('code') || lower.includes('script') ||
      lower.includes('function') || lower.includes('program') ||
      lower.includes('write a') || lower.includes('make a'))
    return 'general'

  // Email
  if (['email', 'mail', 'inbox', 'reply to', 'send mail']
    .some(w => lower.includes(w)))
    return 'email'

  // WhatsApp
  if (['whatsapp', 'send message', 'text', 'message to']
    .some(w => lower.includes(w)))
    return 'whatsapp'

  // Calendar
  if (['schedule', 'remind', 'meeting', 'calendar', 'tomorrow',
       'appointment', 'deadline', 'event']
    .some(w => lower.includes(w)))
    return 'calendar'

  // Research
  if (['research', 'search for', 'look up', 'find me', 'market',
       'latest on', 'news about']
    .some(w => lower.includes(w)))
    return 'research'

  // College
  if (['assignment', 'exam', 'study', 'college', 'dbms', 'dip',
       'subject', 'notes', 'lecture', 'viva', 'semester']
    .some(w => lower.includes(w)))
    return 'college'

  // Game
  if (['game', 'unity', 'unreal', 'character', 'level design',
       'mechanic', 'shader', 'mythology']
    .some(w => lower.includes(w)))
    return 'game'

  // Healthcare
  if (['healthcare', 'hospital', 'medical', 'startup',
       'patient', 'doctor', 'health tech']
    .some(w => lower.includes(w)))
    return 'healthcare'

  return 'general'
}

// MOOD DETECTION
export function detectMood(text: string): Mood {
  const lower = text.toLowerCase()

  if (['wtf', 'what the hell', 'stupid', 'doesnt work', 'why isnt',
       'ugh', 'argh', 'seriously', 'again', 'still not',
       'keeps breaking'].some(w => lower.includes(w)))
    return 'frustrated'

  if (['deadline', 'stuck', 'urgent', 'cant figure', 'not working',
       'broken', 'failing', 'worried', 'lost', 'help me',
       'dont know'].some(w => lower.includes(w)))
    return 'stressed'

  if (['awesome', 'it worked', 'finally', 'yes', 'lets go', 'amazing',
       'love it', 'great', 'perfect', 'wow', 'got it',
       'worked'].some(w => lower.includes(w)))
    return 'excited'

  if (['what is', 'what does', 'how does', 'why does', 'explain',
       'dont get', 'dont understand', 'what do you mean',
       'confused'].some(w => lower.includes(w)))
    return 'confused'

  return 'neutral'
}

// VISUAL DETECTION
export function needsVisual(question: string): boolean {
  const lower = question.toLowerCase()
  return [
    'what am i doing', 'what am i wearing', 'how do i look',
    'what do you see', 'can you see', 'look at', 'what is this',
    'identify', 'my screen', 'this code', 'this error', 'fix this',
    'whats wrong here', 'help me with this', 'read this',
    'describe', 'kya dikh', 'dekho', 'screen dekh',
    'kya kar raha', 'kaisa lag', 'what is that', 'see my',
    'show me what', 'check my screen', 'on my screen'
  ].some(t => lower.includes(t))
}

// MEMORY TRIGGER
export function shouldSaveMemory(question: string): boolean {
  const lower = question.toLowerCase()
  return [
    'remember', 'note this', 'save this', 'dont forget',
    'keep in mind', 'important', 'याद रखो', 'note kar'
  ].some(t => lower.includes(t))
}

// TASK TRIGGER
export function shouldSaveTask(question: string): boolean {
  const lower = question.toLowerCase()
  return [
    'remind me to', 'add task', 'todo', 'i need to',
    'dont let me forget', 'task', 'by tomorrow',
    'by tonight', 'this week'
  ].some(t => lower.includes(t))
}

// BUILD SYSTEM PROMPT
export function buildSystemPrompt(
  language: Language,
  agent: AgentType,
  mood: Mood,
  hasVisual: boolean,
  isScreenSharing: boolean,
  extraFrameCount: number,
  persona: string = MAYA_PERSONA
): string {
  const lang = language === 'hi'
    ? 'Reply in Hinglish — casual desi friend style.'
    : language === 'mr'
    ? 'Reply in Marathi mixed English casually.'
    : 'Reply in English.'

  const visual = hasVisual && isScreenSharing
    ? `Screen visible across ${extraFrameCount + 1} frames. Read exactly what you see.`
    : hasVisual
    ? 'Camera active. Describe only when asked.'
    : ''

  const moodNote = mood !== 'neutral'
    ? MOOD_INSTRUCTIONS[mood]
    : ''

  const agentNote = agent !== 'general' && agent !== 'vision'
    ? `Focus: ${AGENT_INSTRUCTIONS[agent]}`
    : ''

  return [
    persona,
    lang,
    visual,
    moodNote,
    agentNote
  ].filter(Boolean).join('\n')
}
