import { prisma } from '../../utils/prisma'
import { ok, fail, genIssueCode } from '../../utils/response'
import { recordOperationLog } from '../../utils/operation-log'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().min(1).max(64),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  community: z.string().max(64).optional(),
  gridNo: z.string().max(32).optional(),
  location: z.string().max(255).optional(),
  reporterId: z.number().int().optional(),
  reporterPhone: z.string().max(32).optional(),
  reporterName: z.string().max(64).optional(),
  handler: z.string().max(64).optional(),
  voteEndAt: z.string().optional(),
  rectifyDeadline: z.string().optional(),
  photos: z.array(z.object({ url: z.string(), type: z.string().optional() })).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw fail('参数错误: ' + parsed.error.issues.map(i => i.message).join(';'), 400)
  }
  const data = parsed.data
  let reporterId = data.reporterId

  if (!reporterId && data.reporterPhone) {
    const resident = await prisma.resident.upsert({
      where: { phone: data.reporterPhone },
      create: { phone: data.reporterPhone, name: data.reporterName || '居民', community: data.community, address: data.location },
      update: { name: data.reporterName || undefined, community: data.community || undefined, address: data.location || undefined }
    })
    reporterId = resident.id
  }

  const issue = await prisma.issue.create({
    data: {
      code: genIssueCode(),
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || 'NORMAL',
      community: data.community || null,
      gridNo: data.gridNo || null,
      location: data.location || null,
      reporterId,
      handler: data.handler || null,
      voteEndAt: data.voteEndAt ? new Date(data.voteEndAt) : null,
      rectifyDeadline: data.rectifyDeadline ? new Date(data.rectifyDeadline) : null,
      photos: data.photos?.length
        ? { create: data.photos.map(p => ({ url: p.url, type: p.type || 'ISSUE' })) }
        : undefined
    }
  })
  event.context.issueCode = issue.code
  await recordOperationLog({
    operator: data.handler || 'system',
    action: '创建议题',
    detail: `${issue.code} - ${issue.title}`,
    issueId: issue.id
  })
  return ok(issue, '创建成功')
})
