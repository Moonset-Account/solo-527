import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext } from '@/lib/middleware'
import { leadSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'

interface RouteParams {
  params: {
    id: string
  }
}

export const GET = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = params

      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true, address: true, city: true, district: true },
          },
          consultant: { select: { id: true, name: true, email: true, phone: true } },
          assignedTo: { select: { id: true, name: true, email: true, phone: true } },
          surveyRecords: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              consultant: { select: { id: true, name: true } },
            },
          },
          followUps: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              consultant: { select: { id: true, name: true } },
            },
          },
          dealPredictions: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          quoteVersions: {
            take: 5,
            orderBy: { version: 'desc' },
          },
          exceptionRecords: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              surveyRecords: true,
              followUps: true,
              dealPredictions: true,
              quoteVersions: true,
              exceptionRecords: true,
            },
          },
        },
      })

      if (!lead) {
        return NextResponse.json(
          { success: false, error: '线索不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: lead,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取线索详情失败' },
        { status: 500 }
      )
    }
  }
)

export const PUT = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = params
      const body = await req.json()
      const validated = leadSchema.partial().safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const existingLead = await prisma.lead.findUnique({ where: { id } })
      if (!existingLead) {
        return NextResponse.json(
          { success: false, error: '线索不存在' },
          { status: 404 }
        )
      }

      const data: any = { ...validated.data }

      if (data.consultantId || data.assignedToId) {
        data.isPublicSea = false
        data.publicSeaSince = null
      }

      const updatedLead = await prisma.lead.update({
        where: { id },
        data,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          consultant: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      })

      const ctx = getRequestContext(req)
      await recordHistory('Lead', id, 'UPDATE', {
        userId: req.user!.userId,
        ...ctx,
      }, existingLead, updatedLead)

      return NextResponse.json({
        success: true,
        data: updatedLead,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '更新线索失败' },
        { status: 500 }
      )
    }
  }
)

export const DELETE = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = params

      const existingLead = await prisma.lead.findUnique({ where: { id } })
      if (!existingLead) {
        return NextResponse.json(
          { success: false, error: '线索不存在' },
          { status: 404 }
        )
      }

      await prisma.lead.delete({ where: { id } })

      const ctx = getRequestContext(req)
      await recordHistory('Lead', id, 'DELETE', {
        userId: req.user!.userId,
        ...ctx,
      }, existingLead, {})

      return NextResponse.json({
        success: true,
        data: { message: '删除成功' },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '删除线索失败' },
        { status: 500 }
      )
    }
  }
)
