import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const query = getQuery(event)
  const { role, keyword, page = 1, pageSize = 100 } = query

  const where: any = { isActive: true }
  if (role && role !== 'ALL') where.role = role
  if (keyword) {
    where.OR = [
      { name: { contains: String(keyword) } },
      { username: { contains: String(keyword) } },
      { email: { contains: String(keyword) } },
      { department: { contains: String(keyword) } }
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true
      },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy: { name: 'asc' }
    }),
    prisma.user.count({ where })
  ])

  return { data: users, total }
})
