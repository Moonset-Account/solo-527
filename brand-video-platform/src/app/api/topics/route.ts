import { NextResponse } from 'next/server'
import { getRepository } from '@/lib/repository'
import type { TopicStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const { repo, isSupabase } = await getRepository()

  const filters = {
    status: (searchParams.get('status') || undefined) as TopicStatus | undefined,
    creatorId: searchParams.get('creatorId') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    search: searchParams.get('search') || undefined,
    brandLine: searchParams.get('brandLine') || undefined,
    platforms: searchParams.get('platforms')?.split(',').filter(Boolean) || undefined,
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
    orderBy: (searchParams.get('orderBy') || undefined) as any,
    orderDir: (searchParams.get('orderDir') as 'asc' | 'desc') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
  }

  const topics = await repo.listTopics(filters)
  return NextResponse.json({ data: topics, source: isSupabase ? 'supabase' : 'memory' })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { repo } = await getRepository()
  const topic = await repo.createTopic(body)

  await repo.createTimelineEvent({
    topic_id: topic.id,
    event_type: 'topic_created',
    actor_id: topic.creator_id,
    actor_name: topic.creator_name,
    description: `创建选题：${topic.title}`,
    metadata: {},
  })

  return NextResponse.json({ data: topic })
}
