import { prisma, hashPassword } from '../../utils/db'
import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: '无权限执行此操作' })
  }

  const { id } = getRouterParams(event)
  const body = await readBody(event)

  if ('isActive' in body && Object.keys(body).length === 1) {
    return prisma.user.update({
      where: { id: String(id) },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true }
    })
  }

  const { name, email, role, department, phone, password } = body
  const updateData: any = { name, email, role, department, phone }
  if (password) updateData.password = hashPassword(password)

  return prisma.user.update({
    where: { id: String(id) },
    data: updateData,
    select: {
      id: true, username: true, name: true, email: true, role: true,
      department: true, phone: true, isActive: true
    }
  })
})
