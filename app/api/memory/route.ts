import { NextRequest, NextResponse } from 'next/server'
import { getMemories, saveMemory, deleteMemory, searchMemories } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (search) {
    const data = await searchMemories(search)
    return NextResponse.json({ data })
  }

  const data = await getMemories(limit)
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { content, category, source } = await req.json()
  await saveMemory(content, category, source || 'manual')
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await deleteMemory(id)
  return NextResponse.json({ success: true })
}
