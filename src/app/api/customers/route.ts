import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext, parseSearchParams } from '@/lib/middleware'
import { customerSchema, searchSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'
import { UserRole } from '@/generated/prisma'

export const GET = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const params = parseSearchParams(req)
      const validated = searchSchema.safeParse(params)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.errors },
          { status: 400 }
        )
      }

      const { page, pageSize, keyword, sortBy, sortOrder, filters } = validated.data
      const skip = (page - 1) * pageSize

      const where: any = {}
      if (keyword) {
        where.OR = [
          { name: { contains: keyword } },
          { phone: { contains: keyword } },
          { email: { contains: keyword } },
          { address: { contains: keyword } },
        ]
      }
      if (filters?.city) {
        where.city = filters.city
      }
      if (filters?.district) {
        where.district = filters.district
      }

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          include: {
            leads: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                consultant: { select: { id: true, name: true } },
              },
            },
            _count: {
              select: {
                leads: true,
                surveyRecords: true,
              },
            },
          },
        }),
        prisma.customer.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          records: customers,
          total,
          page,
          pageSize,
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取客户列表失败' },
        { status: 500 }
      )
    }
  }
)

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validated = customerSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.errors },
          { status: 400 }
        )
      }

      const customer = await prisma.customer.create({
        data: validated.data,
      })

      const ctx = getRequestContext(req)
      await recordHistory('Customer', customer.id, 'CREATE', {
        userId: req.user!.userId,
        ...ctx,
      }, {}, customer)

      return NextResponse.json({
        success: true,
        data: customer,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '创建客户失败' },
        { status: 500 }
      )
    }
  }
)
