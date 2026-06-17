import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext } from '@/lib/middleware'
import { dealPredictionSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'

interface Params {
  params: Promise<{ id: string }>
}

export const GET = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: Params) => {
    try {
      const { id } = await params
      const prediction = await prisma.dealPrediction.findUnique({
        where: { id },
        include: {
          lead: {
            include: {
              customer: { select: { id: true, name: true, phone: true } },
              consultant: { select: { id: true, name: true } },
            },
          },
          consultant: { select: { id: true, name: true } },
        },
      })

      if (!prediction) {
        return NextResponse.json(
          { success: false, error: '成交预测不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: prediction,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取成交预测详情失败' },
        { status: 500 }
      )
    }
  }
)

export const PUT = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: Params) => {
    try {
      const { id } = await params
      const body = await req.json()
      const validated = dealPredictionSchema.partial().safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const existing = await prisma.dealPrediction.findUnique({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '成交预测不存在' },
          { status: 404 }
        )
      }

      const prediction = await prisma.dealPrediction.update({
        where: { id },
        data: validated.data as any,
      })

      const ctx = getRequestContext(req)
      await recordHistory('DealPrediction', prediction.id, 'UPDATE', {
        userId: req.user!.userId,
        ...ctx,
      }, existing, prediction)

      return NextResponse.json({
        success: true,
        data: prediction,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '更新成交预测失败' },
        { status: 500 }
      )
    }
  }
)
