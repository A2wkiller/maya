import { NextRequest, NextResponse } from 'next/server'
import { getTasks, saveTask, completeTask, deleteTask } from '@/lib/supabase'

export async function GET() {
  const data = await getTasks()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const task = await req.json()
  await saveTask(task)
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json()
  await completeTask(id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await deleteTask(id)
  return NextResponse.json({ success: true })
}
