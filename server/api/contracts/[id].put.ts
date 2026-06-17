import { Prisma } from '@prisma/client'
import { prisma } from '../../../utils/db'

const Decimal = Prisma.Decimal

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const { id } = getRouterParams(event)
  const body = await readBody(event)
  const {
    title, partyA, partyB, contractType, amount, currency,
    signDate, effectiveDate, expiryDate, rectifyDeadline,
    description, keywords, priority
  } = body

  const existing = await prisma.contract.findUnique({ where: { id: String(id) } })
  if (!existing) {
    throw createError({ statusCode: 404, message: '合同不存在' })
  }

  const updated = await prisma.contract.update({
    where: { id: String(id) },
    data: {
      title: title ?? existing.title,
      partyA: partyA ?? existing.partyA,
      partyB: partyB ?? existing.partyB,
      contractType: contractType ?? existing.contractType,
      amount: amount !== undefined ? (amount ? new Decimal(amount) : null) : existing.amount,
      currency: currency !== undefined ? currency : existing.currency,
      signDate: signDate ? new Date(signDate) : existing.signDate,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : existing.effectiveDate,
      expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate,
      rectifyDeadline: rectifyDeadline ? new Date(rectifyDeadline) : existing.rectifyDeadline,
      description: description !== undefined ? description : existing.description,
      keywords: keywords !== undefined ? keywords : existing.keywords,
      priority: priority ?? existing.priority
    }
  })

  await prisma.operationLog.create({
    data: {
      contractId: updated.id,
      userId: session.user.id,
      action: 'CHANGE_STATUS',
      description: `更新合同信息: ${updated.contractNo}`
    }
  })

  return updated
})
