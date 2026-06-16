import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { severity, status, type, candidateId, isBlocking } = query

  const where: any = {}
  if (severity && severity !== 'ALL') where.severity = severity
  if (status && status !== 'ALL') where.status = status
  if (type && type !== 'ALL') where.type = type
  if (candidateId) where.candidateId = Number(candidateId)
  if (isBlocking !== undefined) where.isBlocking = isBlocking === 'true'

  return prisma.reminder.findMany({
    where,
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      interview: { select: { id: true, title: true, scheduledAt: true } }
    },
    orderBy: { sendAt: 'desc' }
  })
})
