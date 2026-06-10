import { NextResponse } from 'next/server'
import { getRepository } from '@/lib/repository'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { repo } = await getRepository()
  const topic = await repo.getTopic(params.id)
  if (!topic) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ data: topic })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { repo } = await getRepository()
  const topic = await repo.updateTopic(params.id, body)
  if (!topic) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (body.status === 'approved') {
    await repo.createTimelineEvent({
      topic_id: topic.id,
      event_type: 'topic_approved',
      actor_id: body.reviewer_id || 'u1',
      actor_name: body.reviewer_name || '张明远',
      description: '审批通过选题',
      metadata: {},
    })
  } else if (body.status === 'rejected') {
    await repo.createTimelineEvent({
      topic_id: topic.id,
      event_type: 'topic_rejected',
      actor_id: body.reviewer_id || 'u1',
      actor_name: body.reviewer_name || '张明远',
      description: '驳回选题',
      metadata: {},
    })
  }

  return NextResponse.json({ data: topic })
}
