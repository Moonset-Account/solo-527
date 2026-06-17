import { prisma, hashPassword } from '../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权限执行此操作' })
  }

  const body = await readBody(event)
  const {
    username, name, email, password, role, department, phone
  } = body

  if (!username || !name || !email || !password || !role) {
    throw createError({ statusCode: 400, message: '必填字段缺失' })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] }
  })
  if (existing) {
    throw createError({ statusCode: 400, message: '用户名或邮箱已存在' })
  }

  const user = await prisma.user.create({
    data: {
      username,
      name,
      email,
      password: hashPassword(password),
      role,
      department,
      phone
    },
    select: {
      id: true, username: true, name: true, email: true, role: true,
      department: true, phone: true, isActive: true, createdAt: true
    }
  })

  return user
})
