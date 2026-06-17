import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext, parseSearchParams } from '@/lib/middleware'
import { quoteVersionSchema, searchSchema } from '@/lib/validation'
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
      if (filters?.leadId) {
        where.leadId = filters.leadId
      }
      if (filters?.version) {
        where.version = Number(filters.version)
      }

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [quoteVersions, total] = await Promise.all([
        prisma.quoteVersion.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          include: {
            lead: {
              include: {
                customer: { select: { id: true, name: true, phone: true } },
                consultant: { select: { id: true, name: true } },
              },
            },
          },
        }),
        prisma.quoteVersion.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          records: quoteVersions,
          total,
          page,
          pageSize,
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取报价版本列表失败' },
        { status: 500 }
      )
    }
  }
)

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validated = quoteVersionSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const quoteVersion = await prisma.quoteVersion.create({
        data: validated.data as any,
      })

      const ctx = getRequestContext(req)
      await recordHistory('QuoteVersion', quoteVersion.id, 'CREATE', {
        userId: req.user!.userId,
        ...ctx,
      }, {}, quoteVersion)

      return NextResponse.json({
        success: true,
        data: quoteVersion,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '创建报价版本失败' },
        { status: 500 }
      )
    }
  }
)
