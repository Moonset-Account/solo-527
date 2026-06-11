import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createTodoSchema = z.object({
  type: z.enum(['READ_FEEDBACK', 'REVIEW_OPINION', 'COVER_VERSION', 'SCRIPT_REVIEW', 'TOPIC_REVIEW']),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  priority: z.number().min(1).max(5).default(1),
  dueDate: z.string().optional(),
  topicId: z.string().optional(),
  scriptId: z.string().optional(),
  coverVersionId: z.string().optional(),
  assigneeId: z.string(),
  readFeedback: z.string().optional(),
  reviewOpinion: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request.headers)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const assigneeId = searchParams.get('assigneeId')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type
    if (assigneeId) where.assigneeId = assigneeId
    else where.assigneeId = user.id

    const [todos, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, avatarUrl: true } },
          topic: { select: { id: true, title: true } },
          script: {
            select: {
              id: true,
              version: true,
              reviewOpinion: true,
              readingFeedback: true,
            },
          },
          coverVersion: {
            select: {
              id: true,
              version: true,
              imageUrl: true,
              feedback: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.todo.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: todos,
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
    const data = createTodoSchema.parse(body)

    const todo = await prisma.todo.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        creatorId: user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        topic: { select: { id: true, title: true } },
        script: { select: { id: true, version: true } },
        coverVersion: { select: { id: true, version: true, imageUrl: true } },
      },
    })

    return NextResponse.json({ success: true, data: todo })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
