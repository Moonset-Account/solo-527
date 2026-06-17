import { prisma, hashPassword, verifyPassword } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: '用户名和密码不能为空' })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    throw createError({ statusCode: 401, message: '用户不存在' })
  }

  if (!verifyPassword(password, user.password)) {
    throw createError({ statusCode: 401, message: '密码错误' })
  }

  if (!user.isActive) {
    throw createError({ statusCode: 403, message: '账户已禁用' })
  }

  const { password: _pw, ...userData } = user
  await setUserSession(event, { user: userData })

  return { user: userData }
})
