import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateScriptSchema = z.object({
  content: z.string().optional(),
  version: z.string().optional(),
  duration: z.number().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED', 'RECORDING', 'COMPLETED']).optional(),
  assigneeId: z.string().optional(),
  reviewOpinion: z.string().optional(),
  readingFeedback: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireAuth(request.headers)
    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, title: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        coverVersions: { orderBy: { createdAt: 'desc' } },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!script) {
      return NextResponse.json(
        { success: false, error: '脚本不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: script })
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
    const data = updateScriptSchema.parse(body)

    const script = await prisma.script.update({
      where: { id },
      data,
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
