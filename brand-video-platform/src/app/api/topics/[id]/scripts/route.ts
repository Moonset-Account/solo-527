import { NextResponse } from 'next/server'
import { getRepository } from '@/lib/repository'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { repo } = await getRepository()
  const scripts = await repo.listScripts(params.id)
  return NextResponse.json({ data: scripts })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { repo } = await getRepository()
  const script = await repo.createScript({
    ...body,
    topic_id: params.id,
  })

  await repo.createTimelineEvent({
    topic_id: params.id,
    event_type: 'script_submitted',
    actor_id: body.author_id,
    actor_name: body.author_name,
    description: `提交脚本 v${script.version}`,
    metadata: { version: script.version, status: script.status },
  })

  return NextResponse.json({ data: script })
}
