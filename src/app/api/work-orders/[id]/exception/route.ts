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
    if (!session || session.user.role === 'RESIDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { impactScope, affectedAreas, handlerId, nextStep } = await request.json()

    const result = await prisma.$transaction(async (tx) => {
      const exception = await tx.workOrderException.upsert({
        where: { workOrderId: params.id },
        update: {
          impactScope,
          affectedAreas,
          handlerId,
          nextStep,
        },
        create: {
          workOrderId: params.id,
          impactScope,
          affectedAreas,
          handlerId,
          nextStep,
        },
      })

      const order = await tx.workOrder.update({
        where: { id: params.id },
        data: {
          isOverdue: true,
          status: 'OVERDUE',
        },
      })

      return { exception, order }
    })

    await createLog({
      userId: session.user.id,
      action: 'UPDATE',
      targetType: 'WorkOrderException',
      targetId: result.exception.id,
      newValue: { impactScope, affectedAreas, nextStep },
      detail: `记录工单异常: 影响范围-${impactScope}, 下一步-${nextStep}`,
    })

    await cacheDelPattern('workorder:*')
    await cacheDelPattern('workorders:*')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Create work order exception error:', error)
    return NextResponse.json({ error: 'Failed to record exception' }, { status: 500 })
  }
}
