import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet, cacheDelPattern } from '@/lib/redis'
import { createLog } from '@/lib/logger'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { WorkOrderStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cacheKey = `workorder:${params.id}:${session.user.id}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const order = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: {
        apartment: true,
        creator: { select: { id: true, name: true, phone: true } },
        assignee: { select: { id: true, name: true, phone: true } },
        exception: {
          include: {
            handler: { select: { id: true, name: true, phone: true } },
          },
        },
        assignments: {
          include: {
            assignee: { select: { name: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
        logs: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (session.user.role === 'RESIDENT' && order.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await cacheSet(cacheKey, order, 15)

    return NextResponse.json(order)
  } catch (error) {
    console.error('Get work order detail error:', error)
    return NextResponse.json({ error: 'Failed to get work order detail' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const oldOrder = await prisma.workOrder.findUnique({ where: { id: params.id } })
    if (!oldOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    const updated = await prisma.workOrder.update({
      where: { id: params.id },
      data,
    })

    await createLog({
      userId: session.user.id,
      action: 'UPDATE',
      targetType: 'WorkOrder',
      targetId: params.id,
      oldValue: oldOrder,
      newValue: updated,
      detail: `更新工单 ${updated.orderNo}`,
    })

    await cacheDelPattern('workorder:*')
    await cacheDelPattern('workorders:*')

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update work order error:', error)
    return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 })
  }
}
