import { prisma } from '../../../utils/prisma'
import { ok, fail } from '../../../utils/response'
import { recordOperationLog } from '../../../utils/operation-log'
import { z } from 'zod'

const schema = z.object({
  action: z.string().min(1),
  handler: z.string().max(64).optional(),
  deadline: z.string().optional(),
  note: z.string().optional(),
  photos: z.array(z.object({ url: z.string(), type: z.string().optional() })).optional()
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

  const rect = await prisma.rectification.create({
    data: {
      issueId: id,
      action: parsed.data.action,
      handler: parsed.data.handler || null,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      note: parsed.data.note || null,
      photos: parsed.data.photos?.length
        ? { create: parsed.data.photos.map(p => ({ url: p.url, type: p.type || 'RECTIFY' })) }
        : undefined
    }
  })

  await prisma.issue.update({ where: { id }, data: { status: 'RECTIFYING' } })

  await recordOperationLog({
    operator: parsed.data.handler || issue.handler || 'system',
    action: '添加整改措施',
    detail: parsed.data.action,
    issueId: id,
    rectificationId: rect.id
  })

  return ok(rect, '整改措施已添加')
})
