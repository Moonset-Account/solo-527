import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

const createAnomalySchema = z.object({
  type: z.enum(['SCHEDULE_CONFLICT', 'MATERIAL_MISSING', 'APPROVAL_DELAY', 'QUALITY_ISSUE', 'OTHER']),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(1, '描述不能为空'),
  topicId: z.string().optional(),
  scriptId: z.string().optional(),
  conflictDetails: z.any().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request.headers)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const groupByType = searchParams.get('groupByType') === 'true'

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    if (groupByType) {
      const grouped = await prisma.anomaly.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      })
      return NextResponse.json({ success: true, data: grouped })
    }

    const [anomalies, total] = await Promise.all([
      prisma.anomaly.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          handler: { select: { id: true, name: true, avatarUrl: true } },
          topic: { select: { id: true, title: true, scheduledDate: true } },
          script: { select: { id: true, version: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.anomaly.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: anomalies,
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
    const data = createAnomalySchema.parse(body)

    const anomaly = await prisma.anomaly.create({
      data: {
        ...data,
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        topic: { select: { id: true, title: true } },
        script: { select: { id: true, version: true } },
      },
    })

    return NextResponse.json({ success: true, data: anomaly })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
