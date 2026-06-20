import { prisma } from '../../utils/prisma'
import { ok, fail } from '../../utils/response'
import { recordOperationLog } from '../../utils/operation-log'
import { z } from 'zod'

const schema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  category: z.string().max(64).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'VOTING', 'RECTIFYING', 'REVIEWING', 'DONE', 'CANCELLED']).optional(),
  community: z.string().max(64).optional(),
  gridNo: z.string().max(32).optional(),
  location: z.string().max(255).optional(),
  handler: z.string().max(64).optional(),
  voteEndAt: z.string().optional(),
  rectifyDeadline: z.string().optional(),
  published: z.boolean().optional(),
  operator: z.string().max(64).optional()
})

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw fail('缺少议题ID', 400)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw fail('参数错误', 400)
  const data: any = { ...parsed.data }
  delete data.operator
  if (data.voteEndAt) data.voteEndAt = new Date(data.voteEndAt)
  if (data.rectifyDeadline) data.rectifyDeadline = new Date(data.rectifyDeadline)
  if (data.published === true) data.publishedAt = new Date()
  data.updatedAt = new Date()

  const existed = await prisma.issue.findUnique({ where: { id } })
  if (!existed) throw fail('议题不存在', 404, 404)
  event.context.issueCode = existed.code

  const issue = await prisma.issue.update({ where: { id }, data })
  await recordOperationLog({
    operator: parsed.data.operator || issue.handler || 'system',
    action: '更新议题',
    detail: JSON.stringify(parsed.data),
    issueId: id
  })
  return ok(issue, '更新成功')
})
