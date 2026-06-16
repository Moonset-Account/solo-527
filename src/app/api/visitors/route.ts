import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet, cacheDelPattern } from '@/lib/redis'
import { createLog } from '@/lib/logger'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { VisitorStatus } from '@prisma/client'
import type { VisitorSummary, PaginatedResult } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status') as VisitorStatus | null
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const cacheKey = `visitors:${session.user.id}:${session.user.role}:${page}:${pageSize}:${status || 'all'}:${dateFrom || 'all'}:${dateTo || 'all'}`
    const cached = await cacheGet<PaginatedResult<VisitorSummary>>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: Record<string, unknown> = {}

    if (session.user.role === 'RESIDENT') {
      where.hostId = session.user.id
    }
    if (status) where.status = status
    if (dateFrom && dateTo) {
      where.visitDate = { gte: new Date(dateFrom), lte: new Date(dateTo) }
    }

    const [total, visitors] = await Promise.all([
      prisma.visitorAppointment.count({ where }),
      prisma.visitorAppointment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { visitDate: 'desc' },
        select: {
          id: true,
          visitorName: true,
          visitorPhone: true,
          visitDate: true,
          visitStartTime: true,
          visitEndTime: true,
          purpose: true,
          status: true,
          apartment: { select: { unitNumber: true } },
        },
      }),
    ])

    const result: PaginatedResult<VisitorSummary> = {
      data: visitors as unknown as VisitorSummary[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    await cacheSet(cacheKey, result, 30)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get visitors error:', error)
    return NextResponse.json({ error: 'Failed to get visitors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    if (session.user.role === 'RESIDENT') {
      const userApt = await prisma.apartment.findFirst({
        where: { residents: { some: { id: session.user.id } } },
      })
      if (!userApt) {
        return NextResponse.json({ error: 'No apartment found' }, { status: 400 })
      }
      data.apartmentId = userApt.id
      data.hostId = session.user.id
      data.status = VisitorStatus.PENDING
    }

    const visitor = await prisma.visitorAppointment.create({ data })

    await createLog({
      userId: session.user.id,
      action: 'CREATE',
      targetType: 'VisitorAppointment',
      targetId: visitor.id,
      newValue: visitor,
      detail: `访客预约: ${visitor.visitorName} - ${visitor.visitDate.toDateString()}`,
    })

    await cacheDelPattern('visitors:*')

    return NextResponse.json(visitor)
  } catch (error) {
    console.error('Create visitor error:', error)
    return NextResponse.json({ error: 'Failed to create visitor appointment' }, { status: 500 })
  }
}
