import { Prisma } from '@prisma/client'
import { prisma, generateContractNo } from '../../utils/db'
import { getUserSession } from '../../utils/session'

const Decimal = Prisma.Decimal

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const body = await readBody(event)
  const {
    title, partyA, partyB, contractType, amount, currency,
    signDate, effectiveDate, expiryDate, rectifyDeadline,
    description, keywords, priority
  } = body

  if (!title || !partyA || !partyB || !contractType) {
    throw createError({ statusCode: 400, message: '必填字段缺失' })
  }

  const contract = await prisma.$transaction(async (tx) => {
    const newContract = await tx.contract.create({
      data: {
        contractNo: generateContractNo(),
        title,
        partyA,
        partyB,
        contractType,
        amount: amount ? new Decimal(amount) : null,
        currency,
        signDate: signDate ? new Date(signDate) : null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        rectifyDeadline: rectifyDeadline ? new Date(rectifyDeadline) : null,
        description,
        keywords,
        priority: priority || 'NORMAL',
        status: 'NEW',
        creatorId: session.user.id
      },
      include: {
        creator: { select: { id: true, name: true, role: true } }
      }
    })

    await tx.operationLog.create({
      data: {
        contractId: newContract.id,
        userId: session.user.id,
        action: 'CREATE_CONTRACT',
        description: `创建合同: ${newContract.contractNo}`,
        toStatus: 'NEW'
      }
    })

    return newContract
  })

  return contract
})
