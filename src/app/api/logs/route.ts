import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/lib/redis'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const action = searchParams.get('action')
    const targetType = searchParams.get('targetType')
    const userId = searchParams.get('userId')

    const cacheKey = `logs:${session.user.id}:${page}:${pageSize}:${action || 'all'}:${targetType || 'all'}:${userId || 'all'}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (targetType) where.targetType = targetType
    if (userId) where.userId = userId

    const [total, logs] = await Promise.all([
      prisma.operationLog.count({ where }),
      prisma.operationLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
      }),
    ])

    const result = {
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    await cacheSet(cacheKey, result, 30)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get logs error:', error)
    return NextResponse.json({ error: 'Failed to get logs' }, { status: 500 })
  }
}
