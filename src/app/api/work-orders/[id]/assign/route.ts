import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheDelPattern } from '@/lib/redis'
import { createLog } from '@/lib/logger'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'CUSTOMER_SERVICE' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assigneeId, remark } = await request.json()

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId, role: 'ENGINEER' },
    })
    if (!assignee) {
      return NextResponse.json({ error: 'Invalid engineer' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.workOrderAssignment.create({
        data: {
          workOrderId: params.id,
          assigneeId,
          assignedBy: session.user.id,
          remark,
        },
      })

      const order = await tx.workOrder.update({
        where: { id: params.id },
        data: {
          assigneeId,
          status: 'ASSIGNED',
        },
        include: {
          assignee: { select: { name: true } },
        },
      })

      return { assignment, order }
    })

    await createLog({
      userId: session.user.id,
      action: 'ASSIGN',
      targetType: 'WorkOrder',
      targetId: params.id,
      newValue: { assigneeId, assigneeName: result.order.assignee?.name, remark },
      detail: `分派工单给 ${result.order.assignee?.name || '工程师'}`,
    })

    await cacheDelPattern('workorder:*')
    await cacheDelPattern('workorders:*')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assign work order error:', error)
    return NextResponse.json({ error: 'Failed to assign work order' }, { status: 500 })
  }
}
