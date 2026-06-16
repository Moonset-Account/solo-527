import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { candidateId, interviewerId, status, from, to } = query

  const where: any = {}
  if (candidateId) where.candidateId = Number(candidateId)
  if (interviewerId) where.interviewerId = Number(interviewerId)
  if (status && status !== 'ALL') where.status = status
  if (from || to) {
    where.scheduledAt = {}
    if (from) where.scheduledAt.gte = new Date(from as string)
    if (to) where.scheduledAt.lte = new Date(to as string)
  }

  return prisma.interview.findMany({
    where,
    include: {
      candidate: { select: { id: true, name: true, email: true, position: true } },
      interviewer: true,
      checkIn: true,
      retryLogs: true
    },
    orderBy: { scheduledAt: 'desc' }
  })
})
