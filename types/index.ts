export type AgentType =
  | 'vision'
  | 'email'
  | 'whatsapp'
  | 'calendar'
  | 'research'
  | 'college'
  | 'game'
  | 'healthcare'
  | 'general'

export type Language = 'en' | 'hi' | 'mr'

export type Mood =
  | 'neutral'
  | 'stressed'
  | 'frustrated'
  | 'excited'
  | 'confused'

export type Status =
  | 'OFFLINE'
  | 'ONLINE'
  | 'ANALYZING'
  | 'THINKING'
  | 'SPEAKING'
  | 'LISTENING'

export interface Message {
  id: string
  question: string
  reply: string
  agent: AgentType
  timestamp: Date
  language: Language
  hasImage: boolean
  isConversation: boolean
  scene?: string
  agentAction?: {
    type: 'pdf' | 'file' | 'memory' | 'system'
    operation: string
    success: boolean
    result: any
  } | null
}

export interface Memory {
  id: string
  content: string
  category: string
  source: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  done: boolean
  priority: 'low' | 'medium' | 'high'
  agent: AgentType
  due_date?: string
  created_at: string
}

export interface Summary {
  id: string
  summary: string
  message_count: number
  date: string
  created_at: string
}

export interface Activity {
  icon: string
  label: string
  type: string
}

export interface AgentStatus {
  agent: AgentType
  status: string
  isActive: boolean
}
