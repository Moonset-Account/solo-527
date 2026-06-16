import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet, cacheDelPattern } from '@/lib/redis'
import { createLog } from '@/lib/logger'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateOrderNo } from '@/lib/utils'
import { WorkOrderStatus } from '@prisma/client'
import type { WorkOrderSummary, PaginatedResult } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigneeId = searchParams.get('assigneeId')
    const apartmentId = searchParams.get('apartmentId')
    const isOverdue = searchParams.get('isOverdue')

    const cacheKey = `workorders:${session.user.id}:${session.user.role}:${page}:${pageSize}:${status || 'all'}:${priority || 'all'}:${assigneeId || 'all'}:${apartmentId || 'all'}:${isOverdue || 'all'}`
    const cached = await cacheGet<PaginatedResult<WorkOrderSummary>>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: Record<string, unknown> = {}

    if (session.user.role === 'RESIDENT') {
      where.creatorId = session.user.id
    } else if (session.user.role === 'ENGINEER') {
      where.assigneeId = session.user.id
    }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId
    if (apartmentId) where.apartmentId = apartmentId
    if (isOverdue !== null) where.isOverdue = isOverdue === 'true'

    const [total, orders] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { isOverdue: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          orderNo: true,
          type: true,
          title: true,
          priority: true,
          status: true,
          isOverdue: true,
          createdAt: true,
          expectedComplete: true,
          apartment: {
            select: { unitNumber: true },
          },
          assignee: {
            select: { name: true },
          },
        },
      }),
    ])

    const result: PaginatedResult<WorkOrderSummary> = {
      data: orders as unknown as WorkOrderSummary[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    await cacheSet(cacheKey, result, 15)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get work orders error:', error)
    return NextResponse.json({ error: 'Failed to get work orders' }, { status: 500 })
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
      const userApts = await prisma.apartment.findFirst({
        where: { residents: { some: { id: session.user.id } } },
      })
      if (!userApts) {
        return NextResponse.json({ error: 'No apartment found' }, { status: 400 })
      }
      data.apartmentId = userApts.id
      data.creatorId = session.user.id
    }

    data.orderNo = generateOrderNo('WO')

    const order = await prisma.workOrder.create({ data })

    await createLog({
      userId: session.user.id,
      action: 'CREATE',
      targetType: 'WorkOrder',
      targetId: order.id,
      newValue: order,
      detail: `创建工单 ${order.orderNo} - ${order.title}`,
    })

    await cacheDelPattern('workorders:*')

    return NextResponse.json(order)
  } catch (error) {
    console.error('Create work order error:', error)
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 })
  }
}
