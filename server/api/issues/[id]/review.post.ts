import { prisma } from '../../../utils/prisma'
import { ok, fail } from '../../../utils/response'
import { recordOperationLog } from '../../../utils/operation-log'
import { z } from 'zod'

const schema = z.object({
  reviewer: z.string().min(1).max(64),
  result: z.enum(['PASS', 'FAIL', 'IMPROVE']),
  comment: z.string().optional(),
  rated: z.number().int().min(1).max(5).optional(),
  photos: z.array(z.object({ url: z.string(), type: z.string().optional() })).optional(),
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

  const review = await prisma.review.create({
    data: {
      issueId: id,
      reviewer: parsed.data.reviewer,
      result: parsed.data.result,
      comment: parsed.data.comment || null,
      rated: parsed.data.rated || null,
      photos: parsed.data.photos?.length
        ? { create: parsed.data.photos.map(p => ({ url: p.url, type: p.type || 'REVIEW' })) }
        : undefined
    }
  })

  const nextStatus = parsed.data.result === 'PASS' ? 'DONE' : 'RECTIFYING'
  await prisma.issue.update({ where: { id }, data: { status: nextStatus, published: nextStatus === 'DONE' ? true : undefined } })

  await recordOperationLog({
    operator: parsed.data.operator || parsed.data.reviewer,
    action: `复查${parsed.data.result === 'PASS' ? '通过' : '未通过'}`,
    detail: parsed.data.comment || '',
    issueId: id
  })

  return ok(review, '复查完成')
})
