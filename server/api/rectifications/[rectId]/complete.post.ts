import { prisma } from '../../../utils/prisma'
import { ok, fail } from '../../../utils/response'
import { recordOperationLog } from '../../../utils/operation-log'

export default defineEventHandler(async (event) => {
  const rectId = Number(getRouterParam(event, 'rectId'))
  if (!rectId) throw fail('缺少整改ID', 400)
  const body = await readBody(event)
  const rect = await prisma.rectification.findUnique({ where: { id: rectId }, include: { issue: true } })
  if (!rect) throw fail('整改措施不存在', 404, 404)
  event.context.issueCode = rect.issue?.code
  const updated = await prisma.rectification.update({
    where: { id: rectId },
    data: { completed: true, completedAt: new Date(), note: body.note || rect.note }
  })
  await recordOperationLog({
    operator: body.operator || rect.handler || 'system',
    action: '完成整改',
    detail: body.note || '',
    issueId: rect.issueId,
    rectificationId: rectId
  })
  return ok(updated, '已标记完成')
})
