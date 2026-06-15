import { mockPrisma, successResponse, errorResponse } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    return errorResponse('请输入用户名和密码')
  }

  const user = await mockPrisma.user.findUnique({ where: { username } })
  if (!user) {
    return errorResponse('用户不存在')
  }

  if (user.password !== password) {
    return errorResponse('密码错误')
  }

  if (!user.active) {
    return errorResponse('账号已被禁用，请联系管理员')
  }

  const roleLabels: Record<string, string> = {
    FRONT_DESK: '前台',
    ADVISOR: '咨询顾问',
    MANAGER: '经理',
    DIRECTOR: '总监',
  }

  const advisor = user.userId ? await mockPrisma.advisor.findUnique({ where: { id: user.userId } }) : null

  const token = btoa(JSON.stringify({
    userId: user.id,
    username: user.username,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }))

  return successResponse({
    token,
    userInfo: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleLabel: roleLabels[user.role] || user.role,
      advisorId: advisor?.id || null,
      advisorName: advisor?.name || null,
    },
    permissions: [
      'customer:view',
      'customer:create',
      'customer:edit',
      'consult:create',
      'consumption:create',
      'quotation:view',
      'return-plan:create',
      'churn:create',
      'report:view',
      'approval:view',
      ...(user.role === 'MANAGER' || user.role === 'DIRECTOR' ? [
        'approval:execute',
        'tag:manage',
        'level:manage',
      ] : []),
      ...(user.role === 'DIRECTOR' ? [
        'user:manage',
        'advisor:manage',
        'channel:manage',
        'dashboard:view',
      ] : []),
    ],
  })
})
