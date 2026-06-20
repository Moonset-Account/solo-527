import { prisma } from '../../utils/prisma'
import { ok, fail } from '../../utils/response'
import { z } from 'zod'

const schema = z.object({
  residentId: z.number().int().optional(),
  residentPhone: z.string().max(32).optional(),
  residentName: z.string().max(64).optional(),
  option: z.enum(['AGREE', 'DISAGREE', 'ABSTAIN']),
  comment: z.string().optional()
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

  if (issue.voteEndAt && new Date(issue.voteEndAt) < new Date()) {
    throw fail('投票已结束', 400)
  }

  let residentId = parsed.data.residentId
  if (!residentId && parsed.data.residentPhone) {
    const resident = await prisma.resident.upsert({
      where: { phone: parsed.data.residentPhone },
      create: {
        phone: parsed.data.residentPhone,
        name: parsed.data.residentName || '居民',
        community: issue.community
      },
      update: { name: parsed.data.residentName || undefined }
    })
    residentId = resident.id
  }
  if (!residentId) throw fail('缺少居民信息', 400)

  const vote = await prisma.vote.upsert({
    where: { issueId_residentId: { issueId: id, residentId } },
    update: { option: parsed.data.option, comment: parsed.data.comment || null },
    create: {
      issueId: id,
      residentId,
      option: parsed.data.option,
      comment: parsed.data.comment || null
    }
  })

  await prisma.issue.update({
    where: { id },
    data: { status: 'VOTING' }
  })

  return ok(vote, '投票成功')
})
