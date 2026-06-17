import { prisma, canTransition, getStatusLabel } from '../../../utils/db'
import { getUserSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const { id } = getRouterParams(event)
  const body = await readBody(event)
  const { status, note } = body

  if (!status) {
    throw createError({ statusCode: 400, message: '目标状态必填' })
  }

  const contract = await prisma.contract.findUnique({ where: { id: String(id) } })
  if (!contract) {
    throw createError({ statusCode: 404, message: '合同不存在' })
  }

  if (!canTransition(contract.status, status)) {
    throw createError({
      statusCode: 400,
      message: `状态流转不允许: ${getStatusLabel(contract.status)} -> ${getStatusLabel(status)}`
    })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.update({
      where: { id: String(id) },
      data: { status }
    })

    await tx.operationLog.create({
      data: {
        contractId: c.id,
        userId: session.user.id,
        action: 'CHANGE_STATUS',
        description: note || `状态变更: ${getStatusLabel(contract.status)} -> ${getStatusLabel(status)}`,
        fromStatus: contract.status,
        toStatus: status
      }
    })

    if (status === 'COMPLETED') {
      const opinions = await tx.reviewOpinion.findMany({
        where: { contractId: c.id, hasGap: true }
      })

      for (const op of opinions) {
        const existingGap = await tx.complianceGap.findFirst({
          where: { contractId: c.id, description: { contains: op.content.slice(0, 50) } }
        })
        if (!existingGap) {
          await tx.complianceGap.create({
            data: {
              contractId: c.id,
              title: op.title || `合规缺口-${op.opinionType}`,
              description: op.content,
              category: op.opinionType,
              severity: (op.severity as any) || 'MEDIUM',
              status: 'OPEN',
              clauseRef: op.clauseRef,
              reporterId: session.user.id
            }
          })
        }
      }
    }

    return c
  })

  return updated
})
