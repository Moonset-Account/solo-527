import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext } from '@/lib/middleware'
import { surveyRecordSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'

interface Params {
  params: { id: string }
}

export const GET = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: Params) => {
    try {
      const survey = await prisma.surveyRecord.findUnique({
        where: { id: params.id },
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          lead: {
            select: {
              id: true,
              source: true,
              stage: true,
              consultant: { select: { id: true, name: true } },
            },
          },
          consultant: { select: { id: true, name: true, phone: true } },
          followUps: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              followUpDate: true,
              followUpType: true,
              content: true,
            },
          },
        },
      })

      if (!survey) {
        return NextResponse.json(
          { success: false, error: '量房记录不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: survey,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取量房记录详情失败' },
        { status: 500 }
      )
    }
  }
)

export const PUT = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: Params) => {
    try {
      const existing = await prisma.surveyRecord.findUnique({
        where: { id: params.id },
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '量房记录不存在' },
          { status: 404 }
        )
      }

      const body = await req.json()
      const validated = surveyRecordSchema.partial().safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const survey = await prisma.surveyRecord.update({
        where: { id: params.id },
        data: validated.data,
      })

      const ctx = getRequestContext(req)
      await recordHistory('SurveyRecord', survey.id, 'UPDATE', {
        userId: req.user!.userId,
        ...ctx,
      }, existing, survey)

      return NextResponse.json({
        success: true,
        data: survey,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '更新量房记录失败' },
        { status: 500 }
      )
    }
  }
)
