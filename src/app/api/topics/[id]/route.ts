import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateTopicSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().min(1).max(5).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED', 'IN_PRODUCTION', 'COMPLETED']).optional(),
  scheduledDate: z.string().optional(),
  deadline: z.string().optional(),
  assigneeId: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireAuth(request.headers)
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        scripts: {
          include: {
            creator: { select: { id: true, name: true } },
            coverVersions: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        materials: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: '选题不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: topic })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireAuth(request.headers)
    const body = await request.json()
    const data = updateTopicSchema.parse(body)

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireAuth(request.headers)
    await prisma.topic.delete({ where: { id } })
    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
