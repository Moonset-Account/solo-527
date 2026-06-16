import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { candidateId, status, type } = query

  const where: any = {}
  if (candidateId) where.candidateId = Number(candidateId)
  if (status && status !== 'ALL') where.status = status
  if (type && type !== 'ALL') where.type = type

  return prisma.assessment.findMany({
    where,
    include: {
      candidate: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
})
