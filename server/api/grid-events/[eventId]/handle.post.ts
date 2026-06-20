import { prisma } from '../../../utils/prisma'
import { ok, fail } from '../../../utils/response'
import { recordOperationLog } from '../../../utils/operation-log'

export default defineEventHandler(async (event) => {
  const eventId = Number(getRouterParam(event, 'eventId'))
  if (!eventId) throw fail('缺少事件ID', 400)
  const body = await readBody(event)
  const gridEvent = await prisma.gridEvent.findUnique({ where: { id: eventId }, include: { issue: true } })
  if (!gridEvent) throw fail('事件不存在', 404, 404)
  event.context.issueCode = gridEvent.issue?.code
  const updated = await prisma.gridEvent.update({
    where: { id: eventId },
    data: { handled: true, handledAt: new Date(), patrolCovered: !!body.patrolCovered, handler: body.handler || gridEvent.handler }
  })
  await recordOperationLog({
    operator: body.operator || gridEvent.handler || 'system',
    action: '网格事件处置完成',
    issueId: gridEvent.issueId
  })
  if (body.patrolCovered && gridEvent.issue?.gridNo) {
    const today = new Date()
    await prisma.patrolStat.upsert({
      where: { date_gridNo: { date: today, gridNo: gridEvent.issue.gridNo } },
      create: { date: today, gridNo: gridEvent.issue.gridNo, handledEventCount: 1, coveredCount: 1 },
      update: { handledEventCount: { increment: 1 }, coveredCount: { increment: 1 } }
    })
  }
  return ok(updated, '已处置')
})
