import { NextResponse } from 'next/server'
import { getRepository } from '@/lib/repository'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { repo } = await getRepository()
  const events = await repo.listTimeline(params.id)
  return NextResponse.json({ data: events })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { repo } = await getRepository()
  const event = await repo.createTimelineEvent({
    ...body,
    topic_id: params.id,
  })
  return NextResponse.json({ data: event })
}
