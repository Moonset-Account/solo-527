import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { candidateId, interviewId, type } = query

  const where: any = {}
  if (candidateId) where.candidateId = Number(candidateId)
  if (interviewId) where.interviewId = Number(interviewId)
  if (type) where.checkInType = type

  return prisma.checkIn.findMany({
    where,
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      interview: { select: { id: true, title: true, scheduledAt: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
})
