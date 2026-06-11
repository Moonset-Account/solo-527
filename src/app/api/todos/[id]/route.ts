import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateTodoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.number().min(1).max(5).optional(),
  dueDate: z.string().optional(),
  readFeedback: z.string().optional(),
  reviewOpinion: z.string().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireAuth(request.headers)
    const body = await request.json()
    const data = updateTodoSchema.parse(body)

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
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
