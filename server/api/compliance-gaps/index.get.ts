import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const query = getQuery(event)
  const {
    page = 1,
    pageSize = 50,
    status,
    severity,
    category,
    contractId
  } = query

  const where: any = {}
  if (status && status !== 'ALL') where.status = status
  if (severity && severity !== 'ALL') where.severity = severity
  if (category && category !== 'ALL') where.category = category
  if (contractId) where.contractId = String(contractId)

  const [gaps, total] = await Promise.all([
    prisma.complianceGap.findMany({
      where,
      include: {
        contract: { select: { id: true, contractNo: true, title: true } },
        reporter: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } }
      },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.complianceGap.count({ where })
  ])

  const stats = {
    total,
    open: await prisma.complianceGap.count({ where: { ...where, status: 'OPEN' } }),
    inProgress: await prisma.complianceGap.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    resolved: await prisma.complianceGap.count({ where: { ...where, status: 'RESOLVED' } }),
    closed: await prisma.complianceGap.count({ where: { ...where, status: 'CLOSED' } }),
    critical: await prisma.complianceGap.count({ where: { ...where, severity: 'CRITICAL' } }),
    high: await prisma.complianceGap.count({ where: { ...where, severity: 'HIGH' } }),
    medium: await prisma.complianceGap.count({ where: { ...where, severity: 'MEDIUM' } }),
    low: await prisma.complianceGap.count({ where: { ...where, severity: 'LOW' } })
  }

  return { data: gaps, total, stats, page: Number(page), pageSize: Number(pageSize) }
})
