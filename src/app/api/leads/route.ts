import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext, parseSearchParams } from '@/lib/middleware'
import { leadSchema, searchSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'
import { LeadSource, LeadStage } from '@/generated/prisma'

export const GET = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const params = parseSearchParams(req)
      const validated = searchSchema.safeParse(params)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const { page, pageSize, keyword, sortBy, sortOrder, filters } = validated.data
      const skip = (page - 1) * pageSize

      const where: any = {}

      if (keyword) {
        where.OR = [
          { description: { contains: keyword } },
          { customer: { name: { contains: keyword } } },
          { customer: { phone: { contains: keyword } } },
        ]
      }

      if (filters?.source && typeof filters.source === 'string' && Object.values(LeadSource).includes(filters.source as LeadSource)) {
        where.source = filters.source as LeadSource
      }

      if (filters?.stage && typeof filters.stage === 'string' && Object.values(LeadStage).includes(filters.stage as LeadStage)) {
        where.stage = filters.stage as LeadStage
      }

      if (filters?.consultantId) {
        where.consultantId = filters.consultantId
      }

      if (filters?.assignedToId) {
        where.assignedToId = filters.assignedToId
      }

      if (filters?.isPublicSea !== undefined) {
        where.isPublicSea = filters.isPublicSea
      }

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          include: {
            customer: {
              select: { id: true, name: true, phone: true, city: true, district: true },
            },
            consultant: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
            _count: {
              select: {
                surveyRecords: true,
                followUps: true,
                dealPredictions: true,
              },
            },
          },
        }),
        prisma.lead.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          records: leads,
          total,
          page,
          pageSize,
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取线索列表失败' },
        { status: 500 }
      )
    }
  }
)

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validated = leadSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const data: any = { ...validated.data }

      if (data.consultantId || data.assignedToId) {
        data.isPublicSea = false
        data.publicSeaSince = null
      } else {
        data.isPublicSea = true
        data.publicSeaSince = new Date()
      }

      const lead = await prisma.lead.create({
        data,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          consultant: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      })

      const ctx = getRequestContext(req)
      await recordHistory('Lead', lead.id, 'CREATE', {
        userId: req.user!.userId,
        ...ctx,
      }, {}, lead)

      return NextResponse.json({
        success: true,
        data: lead,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '创建线索失败' },
        { status: 500 }
      )
    }
  }
)
