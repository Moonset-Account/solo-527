import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext, parseSearchParams } from '@/lib/middleware'
import { userSchema, searchSchema } from '@/lib/validation'
import { hashPassword } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'
import { UserRole } from '@/generated/prisma'

export const GET = authMiddleware([UserRole.ADMIN, UserRole.SALES_MANAGER])(
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
          { email: { contains: keyword } },
          { phone: { contains: keyword } },
        ]
      }
      if (filters?.role) {
        where.role = filters.role
      }
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            avatar: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                leads: true,
                surveyRecords: true,
                followUps: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          records: users,
          total,
          page,
          pageSize,
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取用户列表失败' },
        { status: 500 }
      )
    }
  }
)

export const POST = authMiddleware([UserRole.ADMIN])(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validated = userSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.errors },
          { status: 400 }
        )
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: validated.data.email },
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: '该邮箱已被注册' },
          { status: 400 }
        )
      }

      const passwordHash = await hashPassword(validated.data.password || '123456')

      const user = await prisma.user.create({
        data: {
          name: validated.data.name,
          email: validated.data.email,
          passwordHash,
          role: validated.data.role as UserRole,
          phone: validated.data.phone,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      })

      const ctx = getRequestContext(req)
      await recordHistory('User', user.id, 'CREATE', {
        userId: req.user!.userId,
        ...ctx,
      }, {}, user)

      return NextResponse.json({
        success: true,
        data: user,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '创建用户失败' },
        { status: 500 }
      )
    }
  }
)
