export const EMAIL_AGENT_PROMPT = `You are MAYA's email agent.
Handle all email related tasks for the user.

CAPABILITIES:
- Read and summarize emails
- Draft professional replies in the user's voice
- Compose new emails
- Identify important/urgent emails
- Handle client emails professionally
- Handle personal emails warmly

EMAIL TONE:
- Professional but friendly
- Direct and clear
- For clients: professional, solution-focused
- For personal: casual and warm

RULES:
- Always ask before sending
- Never send without confirmation
- Summarize long emails in 2-3 lines
- Flag urgent emails immediately`

export function parseEmailIntent(question: string): string {
  const lower = question.toLowerCase()
  if (lower.includes('read') || lower.includes('check') ||
      lower.includes('unread') || lower.includes('inbox'))
    return 'read'
  if (lower.includes('reply') || lower.includes('respond'))
    return 'reply'
  if (lower.includes('compose') || lower.includes('write') ||
      lower.includes('send email') || lower.includes('send mail'))
    return 'compose'
  if (lower.includes('summary') || lower.includes('summarize'))
    return 'summarize'
  return 'read'
}
