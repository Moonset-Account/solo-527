import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { search, stage, status, department, page = 1, pageSize = 20 } = query

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { email: { contains: search as string } },
      { position: { contains: search as string } }
    ]
  }
  if (stage && stage !== 'ALL') where.currentStage = stage
  if (status && status !== 'ALL') where.status = status
  if (department && department !== 'ALL') where.department = department

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: {
        interviews: { take: 1, orderBy: { createdAt: 'desc' } },
        assessments: true,
        _count: { select: { interviews: true, assessments: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize)
    }),
    prisma.candidate.count({ where })
  ])

  return { data: candidates, total, page: Number(page), pageSize: Number(pageSize) }
})
