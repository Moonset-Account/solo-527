import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext, parseSearchParams } from '@/lib/middleware'
import { surveyRecordSchema, searchSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'

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
          { address: { contains: keyword } },
          { houseType: { contains: keyword } },
          { decorationNeeds: { contains: keyword } },
          { customer: { name: { contains: keyword } } },
          { customer: { phone: { contains: keyword } } },
        ]
      }
      if (filters?.leadId) {
        where.leadId = filters.leadId
      }
      if (filters?.customerId) {
        where.customerId = filters.customerId
      }
      if (filters?.consultantId) {
        where.consultantId = filters.consultantId
      }

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [surveys, total] = await Promise.all([
        prisma.surveyRecord.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            lead: { select: { id: true, source: true, stage: true } },
            consultant: { select: { id: true, name: true } },
          },
        }),
        prisma.surveyRecord.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          records: surveys,
          total,
          page,
          pageSize,
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取量房记录列表失败' },
        { status: 500 }
      )
    }
  }
)

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validated = surveyRecordSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const survey = await prisma.surveyRecord.create({
        data: {
          ...validated.data,
          consultantId: req.user!.userId,
        },
      })

      const ctx = getRequestContext(req)
      await recordHistory('SurveyRecord', survey.id, 'CREATE', {
        userId: req.user!.userId,
        ...ctx,
      }, {}, survey)

      return NextResponse.json({
        success: true,
        data: survey,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '创建量房记录失败' },
        { status: 500 }
      )
    }
  }
)
