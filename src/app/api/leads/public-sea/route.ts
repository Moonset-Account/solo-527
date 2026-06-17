import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, parseSearchParams } from '@/lib/middleware'
import { searchSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
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

      const where: any = {
        isPublicSea: true,
      }

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

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { publicSeaSince: 'desc' }

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
            _count: {
              select: {
                surveyRecords: true,
                followUps: true,
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
        { success: false, error: error.message || '获取公海线索列表失败' },
        { status: 500 }
      )
    }
  }
)
