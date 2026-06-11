import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createTopicSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(1, '描述不能为空'),
  tags: z.array(z.string()).default([]),
  priority: z.number().min(1).max(5).default(1),
  scheduledDate: z.string().optional(),
  deadline: z.string().optional(),
  assigneeId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request.headers)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const keyword = searchParams.get('keyword')

    const where: any = {}
    if (status) where.status = status
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ]
    }

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          scripts: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.topic.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: topics,
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
    const data = createTopicSchema.parse(body)

    const topic = await prisma.topic.create({
      data: {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({ success: true, data: topic })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
