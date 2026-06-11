import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createScriptSchema = z.object({
  topicId: z.string(),
  version: z.string().default('1.0'),
  content: z.string().min(1, '脚本内容不能为空'),
  duration: z.number().optional(),
  assigneeId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request.headers)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const topicId = searchParams.get('topicId')

    const where: any = {}
    if (status) where.status = status
    if (topicId) where.topicId = topicId

    const [scripts, total] = await Promise.all([
      prisma.script.findMany({
        where,
        include: {
          topic: { select: { id: true, title: true } },
          creator: { select: { id: true, name: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          coverVersions: { orderBy: { createdAt: 'desc' } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.script.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: scripts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request.headers)
    const body = await request.json()
    const data = createScriptSchema.parse(body)

    const script = await prisma.script.create({
      data: {
        ...data,
        creatorId: user.id,
      },
      include: {
        topic: { select: { id: true, title: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({ success: true, data: script })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
