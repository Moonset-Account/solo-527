import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext, parseSearchParams } from '@/lib/middleware'
import { exceptionRecordSchema, searchSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'
import { ChurnReason } from '@/generated/prisma'

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
      if (filters?.customerId) {
        where.customerId = filters.customerId
      }
      if (filters?.responsibleId) {
        where.responsibleId = filters.responsibleId
      }
      if (filters?.churnReason) {
        where.churnReason = filters.churnReason as ChurnReason
      }
      if (filters?.isResolved !== undefined) {
        where.isResolved = filters.isResolved
      }

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [exceptions, total] = await Promise.all([
        prisma.exceptionRecord.findMany({
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
            customer: { select: { id: true, name: true, phone: true } },
            responsible: { select: { id: true, name: true } },
          },
        }),
        prisma.exceptionRecord.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          records: exceptions,
          total,
          page,
          pageSize,
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取异常记录列表失败' },
        { status: 500 }
      )
    }
  }
)

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validated = exceptionRecordSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const data: any = { ...validated.data }
      
      if (data.handlingEndAt && data.handlingStartAt) {
        const start = new Date(data.handlingStartAt)
        const end = new Date(data.handlingEndAt)
        data.handlingMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      }

      const exception = await prisma.exceptionRecord.create({
        data,
      })

      const ctx = getRequestContext(req)
      await recordHistory('ExceptionRecord', exception.id, 'CREATE', {
        userId: req.user!.userId,
        ...ctx,
      }, {}, exception)

      return NextResponse.json({
        success: true,
        data: exception,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '创建异常记录失败' },
        { status: 500 }
      )
    }
  }
)
