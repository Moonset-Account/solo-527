import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'
import { createLog } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const { applicantName, accountType, targetSystem, reason, applicantDept } = body

  if (!applicantName || !accountType || !targetSystem || !reason || !applicantDept) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要参数' })
  }

  const application = await prisma.accountApplication.create({
    data: { applicantName, accountType, targetSystem, reason, applicantDept }
  })

  await createLog({
    actionType: 'ACCOUNT_APPLY',
    userId: user.id,
    afterData: { applicantName, accountType, targetSystem, applicantDept },
    note: `账号申请: ${accountType} - ${targetSystem}`
  })

  return application
})
