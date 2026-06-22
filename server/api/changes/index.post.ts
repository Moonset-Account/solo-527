import { prisma } from '../../plugins/prisma'
import { requireAuth } from '../../utils/auth'
import { generateChangeNo } from '../../utils/generator'
import { createLog } from '../../utils/logger'
import { notifyAdmins } from '../../utils/notification'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const { alertId, title, type, description, impactScope, changePlan, rollbackPlan, windowStart, windowEnd } = body

  if (!alertId || !title || !type || !description || !impactScope || !changePlan || !rollbackPlan) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要参数' })
  }

  const alert = await prisma.alert.findUnique({ where: { id: alertId } })
  if (!alert) {
    throw createError({ statusCode: 404, statusMessage: '关联告警不存在' })
  }

  const change = await prisma.changeRequest.create({
    data: {
      changeNo: generateChangeNo(),
      alertId,
      title,
      type,
      description,
      impactScope,
      changePlan,
      rollbackPlan,
      windowStart: windowStart ? new Date(windowStart) : null,
      windowEnd: windowEnd ? new Date(windowEnd) : null,
      submitterId: user.id
    }
  })

  await prisma.alert.update({
    where: { id: alertId },
    data: { status: 'CHANGING' }
  })

  await createLog({
    actionType: 'CHANGE_REQUEST_SUBMIT',
    userId: user.id,
    alertId,
    changeId: change.id,
    afterData: { title, type, description, impactScope, changePlan, rollbackPlan },
    note: `变更申请已提交: ${change.changeNo}`
  })

  await createLog({
    actionType: 'ALERT_STATUS_CHANGE',
    userId: user.id,
    alertId,
    beforeData: { status: alert.status },
    afterData: { status: 'CHANGING' },
    note: `关联变更申请: ${change.changeNo}`
  })

  await notifyAdmins({
    type: 'approval',
    title: `新变更申请待审批: ${change.changeNo}`,
    content: `${user.realName} 提交了变更申请: ${title}`,
    alertId,
    changeId: change.id
  })

  return change
})
