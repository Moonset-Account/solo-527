import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext } from '@/lib/middleware'
import { exceptionRecordSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'

interface Params {
  params: Promise<{ id: string }>
}

export const GET = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: Params) => {
    try {
      const { id } = await params
      const exception = await prisma.exceptionRecord.findUnique({
        where: { id },
        include: {
          lead: {
            include: {
              customer: { select: { id: true, name: true, phone: true } },
              consultant: { select: { id: true, name: true } },
            },
          },
          customer: { select: { id: true, name: true, phone: true } },
          responsible: { select: { id: true, name: true } },
        },
      })

      if (!exception) {
        return NextResponse.json(
          { success: false, error: '异常记录不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: exception,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取异常记录详情失败' },
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
      const validated = exceptionRecordSchema.partial().safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const existing = await prisma.exceptionRecord.findUnique({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '异常记录不存在' },
          { status: 404 }
        )
      }

      const data: any = { ...validated.data }
      
      const handlingStartAt = data.handlingStartAt || existing.handlingStartAt
      const handlingEndAt = data.handlingEndAt || existing.handlingEndAt

      if (handlingEndAt && handlingStartAt) {
        const start = new Date(handlingStartAt)
        const end = new Date(handlingEndAt)
        data.handlingMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      }

      const exception = await prisma.exceptionRecord.update({
        where: { id },
        data,
      })

      const ctx = getRequestContext(req)
      await recordHistory('ExceptionRecord', exception.id, 'UPDATE', {
        userId: req.user!.userId,
        ...ctx,
      }, existing, exception)

      return NextResponse.json({
        success: true,
        data: exception,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '更新异常记录失败' },
        { status: 500 }
      )
    }
  }
)
