import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext, parseSearchParams } from '@/lib/middleware'
import { dealPredictionSchema, searchSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'
import { DealConfidence } from '@/generated/prisma'

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
      if (filters?.leadId) {
        where.leadId = filters.leadId
      }
      if (filters?.confidence) {
        where.confidence = filters.confidence as DealConfidence
      }
      if (filters?.isFinal !== undefined) {
        where.isFinal = filters.isFinal
      }

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [predictions, total] = await Promise.all([
        prisma.dealPrediction.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          include: {
            lead: {
              include: {
                customer: { select: { id: true, name: true, phone: true } },
              },
            },
            consultant: { select: { id: true, name: true } },
          },
        }),
        prisma.dealPrediction.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          records: predictions,
          total,
          page,
          pageSize,
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取成交预测列表失败' },
        { status: 500 }
      )
    }
  }
)

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validated = dealPredictionSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const prediction = await prisma.dealPrediction.create({
        data: {
          ...validated.data,
          consultantId: req.user!.userId,
        } as any,
      })

      const ctx = getRequestContext(req)
      await recordHistory('DealPrediction', prediction.id, 'CREATE', {
        userId: req.user!.userId,
        ...ctx,
      }, {}, prediction)

      return NextResponse.json({
        success: true,
        data: prediction,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '创建成交预测失败' },
        { status: 500 }
      )
    }
  }
)
