import { createClient } from '@supabase/supabase-js'
import { KEYS } from './keys'

export const supabase = KEYS.supabaseUrl && KEYS.supabaseAnon
  ? createClient(KEYS.supabaseUrl, KEYS.supabaseAnon)
  : null

export const saveMessage = async (data: {
  question: string
  reply: string
  agent: string
  language: string
  has_image?: boolean
}) => {
  if (!supabase) return
  await supabase.from('conversations').insert(data)
}

export const saveMemory = async (
  content: string,
  category: string,
  source: string
) => {
  if (!supabase) return
  await supabase.from('memory').insert({ content, category, source })
}

export const getMemories = async (limit = 50) => {
  if (!supabase) return []
  const { data } = await supabase
    .from('memory')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export const searchMemories = async (search: string) => {
  if (!supabase) return []
  const { data } = await supabase
    .from('memory')
    .select('*')
    .ilike('content', `%${search}%`)
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export const deleteMemory = async (id: string) => {
  if (!supabase) return
  await supabase.from('memory').delete().eq('id', id)
}

export const saveTask = async (task: {
  title: string
  priority?: string
  agent?: string
}) => {
  if (!supabase) return
  await supabase.from('tasks').insert({
    title: task.title,
    priority: task.priority || 'medium',
    agent: task.agent || 'general',
    completed: false
  })
}

export const getTasks = async () => {
  if (!supabase) return []
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  return data || []
}

export const completeTask = async (id: string) => {
  if (!supabase) return
  await supabase
    .from('tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', id)
}

export const deleteTask = async (id: string) => {
  if (!supabase) return
  await supabase.from('tasks').delete().eq('id', id)
}

export const saveSummary = async (content: string, exchange_count: number) => {
  if (!supabase) return
  await supabase.from('summaries').insert({ content, exchange_count })
}

export const getSummaries = async (limit = 10) => {
  if (!supabase) return []
  const { data } = await supabase
    .from('summaries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}
