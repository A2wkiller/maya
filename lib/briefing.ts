export type Briefing = {
  date: string
  items: string[]
}

export function buildBriefing(): Briefing {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const items = [
    `Weather check for ${now.toLocaleDateString()}`,
    'Top calendar events for today',
    'Unread important emails',
    'Pending tasks to wrap',
    'Latest news headlines'
  ]
  return { date, items }
}

export function shouldShowBriefing(lastShown?: string) {
  const today = new Date().toISOString().slice(0, 10)
  return lastShown !== today
}
