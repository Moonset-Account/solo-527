import { prisma } from '../../../utils/prisma'
import { ok, fail } from '../../../utils/response'
import { recordOperationLog } from '../../../utils/operation-log'
import { z } from 'zod'

const schema = z.object({
  eventType: z.string().min(1).max(64),
  description: z.string().min(1),
  gridNo: z.string().min(1).max(32),
  handler: z.string().max(64).optional(),
  occurredAt: z.string().optional(),
  operator: z.string().max(64).optional()
})

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw fail('缺少议题ID', 400)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw fail('参数错误', 400)

  const issue = await prisma.issue.findUnique({ where: { id } })
  if (!issue) throw fail('议题不存在', 404, 404)
  event.context.issueCode = issue.code

  const gridEvent = await prisma.gridEvent.create({
    data: {
      issueId: id,
      eventType: parsed.data.eventType,
      description: parsed.data.description,
      gridNo: parsed.data.gridNo,
      handler: parsed.data.handler || null,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date()
    }
  })

  await recordOperationLog({
    operator: parsed.data.operator || parsed.data.handler || 'system',
    action: '关联网格事件',
    detail: `${parsed.data.eventType} - ${parsed.data.description.slice(0, 50)}`,
    issueId: id
  })

  return ok(gridEvent, '已关联网格事件')
})
