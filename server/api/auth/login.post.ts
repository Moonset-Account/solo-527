export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: '请输入用户名和密码' })
  }

  const db = useDB()
  const user = await db.user.findUnique({ where: { username } })

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, message: '用户名或密码错误' })
  }

  const token = signToken({ userId: user.id, role: user.role })

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      supervisorId: user.supervisorId,
    }
  }
})
