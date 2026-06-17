import { prisma, canTransition } from '../../../utils/db'
import { getUserSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const { id } = getRouterParams(event)
  const contract = await prisma.contract.findUnique({ where: { id: String(id) } })
  if (!contract) {
    throw createError({ statusCode: 404, message: '合同不存在' })
  }

  const body = await readBody(event)
  const {
    opinionType, title, content, clauseRef, severity, suggestion, hasGap, versionId
  } = body

  if (!opinionType || !content) {
    throw createError({ statusCode: 400, message: '意见类型和内容必填' })
  }

  const result = await prisma.$transaction(async (tx) => {
    const opinion = await tx.reviewOpinion.create({
      data: {
        contractId: String(id),
        versionId,
        authorId: session.user.id,
        opinionType,
        title,
        content,
        clauseRef,
        severity,
        suggestion,
        hasGap: hasGap || false
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatar: true } },
        version: { select: { id: true, versionNo: true, fileName: true } }
      }
    })

    let newStatus = contract.status
    const actionType: any = 'SUBMIT_OPINION'

    if (opinionType === 'LAW_REVIEW') {
      if (contract.status === 'ASSIGNED_LAWYER' || contract.status === 'LAWYER_REVIEWING') {
        newStatus = hasGap ? 'PENDING_RECTIFICATION' : 'LAWYER_COMPLETED'
      }
      await tx.assignment.updateMany({
        where: { contractId: String(id) },
        data: { lawyerCompletedAt: new Date() }
      })
    } else if (opinionType === 'FINAL_REVIEW') {
      if (contract.status === 'ASSIGNED_REVIEWER' || contract.status === 'REVIEWER_REVIEWING') {
        newStatus = hasGap ? 'PENDING_RECTIFICATION' : 'REVIEWER_COMPLETED'
      }
      await tx.assignment.updateMany({
        where: { contractId: String(id) },
        data: { reviewerCompletedAt: new Date() }
      })
    } else if (opinionType === 'RECTIFICATION') {
      if (contract.status === 'PENDING_RECTIFICATION') {
        newStatus = 'RECTIFYING'
      }
    }

    if (newStatus !== contract.status && canTransition(contract.status, newStatus)) {
      await tx.contract.update({
        where: { id: String(id) },
        data: { status: newStatus }
      })
    }

    await tx.operationLog.create({
      data: {
        contractId: String(id),
        userId: session.user.id,
        action: actionType,
        description: `提交${opinionType === 'LAW_REVIEW' ? '法律' : opinionType === 'FINAL_REVIEW' ? '复核' : opinionType === 'RECTIFICATION' ? '整改' : '评论'}意见${title ? ': ' + title : ''}`,
        toStatus: newStatus !== contract.status ? newStatus : undefined
      }
    })

    return opinion
  })

  return result
})
