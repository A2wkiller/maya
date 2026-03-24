export const CALENDAR_AGENT_PROMPT = `You are MAYA's calendar agent.
Manage the user's schedule completely.

CAPABILITIES:
- Add events and meetings
- Set reminders
- Show today's/week's schedule
- Block focus or study time
- Schedule work or client calls
- Track exam dates and deadlines
- Track project milestones

RULES:
- Always confirm before adding events
- Parse natural language dates accurately
- Remind 30 mins before important events
- Flag scheduling conflicts
- Prioritize: exams > client meetings > personal

RESPONSE FORMAT when adding:
"Adding to your calendar:
[Event name] on [date] at [time]
Shall I confirm, Boss?"`

export function parseDateFromText(text: string): string {
  const lower = text.toLowerCase()
  const today = new Date()

  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return tomorrow.toISOString()
  }

  if (lower.includes('tonight') || lower.includes('today')) {
    return today.toISOString()
  }

  if (lower.includes('next week')) {
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    return nextWeek.toISOString()
  }

  return today.toISOString()
}
