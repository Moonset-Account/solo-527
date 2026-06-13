export default defineEventHandler(async (event) => {
  const currentUser = await requireAuth(event)
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw createError({ statusCode: 403, message: '无权创建用户' })
  }

  const body = await readBody(event)
  const { username, displayName, password, role } = body

  if (!username || !displayName || !password) {
    throw createError({ statusCode: 400, message: '请填写完整信息' })
  }

  const db = useDB()
  const existing = await db.user.findUnique({ where: { username } })
  if (existing) {
    throw createError({ statusCode: 409, message: '用户名已存在' })
  }

  const allowedRoles = currentUser.role === 'admin' ? ['supervisor', 'agent'] : ['agent']
  const userRole = allowedRoles.includes(role) ? role : 'agent'

  const user = await db.user.create({
    data: {
      username,
      displayName,
      passwordHash: hashPassword(password),
      role: userRole,
      supervisorId: currentUser.role === 'supervisor' ? currentUser.id : null,
    },
  })

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    supervisorId: user.supervisorId,
  }
})
