import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createProductionSchema = z.object({
  date: z.string(),
  topicId: z.string().optional(),
  materialId: z.string().optional(),
  contentType: z.string().min(1, '内容类型不能为空'),
  outputCount: z.number().min(0).default(0),
  videoDuration: z.number().optional(),
  qualityScore: z.number().min(1).max(100).optional(),
  tags: z.array(z.string()).default([]),
  remarks: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAuth(request.headers)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const contentType = searchParams.get('contentType')
    const minQuality = searchParams.get('minQuality')
    const maxQuality = searchParams.get('maxQuality')

    const where: any = {}
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) }
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) }
    if (userId) where.userId = userId
    if (contentType) where.contentType = contentType
    if (minQuality) where.qualityScore = { ...where.qualityScore, gte: parseInt(minQuality) }
    if (maxQuality) where.qualityScore = { ...where.qualityScore, lte: parseInt(maxQuality) }

    const [records, total] = await Promise.all([
      prisma.productionRecord.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          topic: { select: { id: true, title: true } },
          material: { select: { id: true, name: true, type: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: 'desc' },
      }),
      prisma.productionRecord.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: records,
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
    const data = createProductionSchema.parse(body)

    const record = await prisma.productionRecord.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        topic: { select: { id: true, title: true } },
        material: { select: { id: true, name: true, type: true } },
      },
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
