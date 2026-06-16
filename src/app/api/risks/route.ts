import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getCurrentUser, requireRole } from '@/lib/auth'

const resolveRiskSchema = z.object({
  resolutionNote: z.string().min(1, '处理说明不能为空'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isResolved = searchParams.get('isResolved')

    const user = await getCurrentUser()

    const where: any = {}
    if (isResolved !== null) {
      where.isResolved = isResolved === 'true'
    }

    const risks = await prisma.riskSample.findMany({
      where,
      include: {
        conversation: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        knowledgeItems: {
          include: {
            knowledge: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: risks,
    })
  } catch (error) {
    console.error('Get risks error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole('ADMIN', 'SUPERVISOR')
    const body = await request.json()
    const { id, resolutionNote } = resolveRiskSchema.parse(body)
    const user = await getCurrentUser()

    if (!id) {
      return NextResponse.json(
        { success: false, error: '风险样本ID不能为空' },
        { status: 400 }
      )
    }

    const existing = await prisma.riskSample.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '风险样本不存在' },
        { status: 404 }
      )
    }

    const updated = await prisma.riskSample.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: user.name,
        resolutionNote,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Resolve risk error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
