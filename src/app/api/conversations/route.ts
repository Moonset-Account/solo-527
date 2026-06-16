import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { checkAccuracyThreshold } from '@/lib/notifications'

const updateConversationSchema = z.object({
  finalReply: z.string().optional(),
  status: z.enum(['ACCEPTED', 'MODIFIED', 'REJECTED', 'PENDING']).optional(),
  accuracyScore: z.number().min(0).max(1).optional(),
  changeReason: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const user = await getCurrentUser()

    const where: any = {}
    if (status) {
      where.status = status
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          retrievalRecords: {
            include: {
              knowledge: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                },
              },
            },
          },
          generationLogs: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          promptVersion: {
            select: {
              id: true,
              version: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const id = (body as Record<string, unknown>).id as string | undefined
    const data = updateConversationSchema.parse(body)
    const user = await getCurrentUser()

    if (!id) {
      return NextResponse.json(
        { success: false, error: '会话ID不能为空' },
        { status: 400 }
      )
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: '会话不存在' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (data.finalReply !== undefined) updateData.finalReply = data.finalReply
    if (data.status !== undefined) updateData.status = data.status
    if (data.accuracyScore !== undefined) updateData.accuracyScore = data.accuracyScore

    const updated = await prisma.conversation.update({
      where: { id },
      data: updateData,
    })

    if (data.finalReply && conversation.suggestedReply !== data.finalReply) {
      await prisma.generationLog.create({
        data: {
          conversationId: id,
          previousResult: conversation.suggestedReply,
          currentResult: data.finalReply,
          changeReason: data.changeReason,
          changedBy: user.name,
        },
      })
    }

    await checkAccuracyThreshold()

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Update conversation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
