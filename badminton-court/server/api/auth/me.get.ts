import prisma from '../../utils/prisma'
import { getAuthUser } from '../../utils/auth'
import { successResponse, errorResponse } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthUser(event)
    if (!user) {
      return errorResponse('未登录', 401)
    }

    const permissionCodes = user.role === 'SUPER_ADMIN'
      ? (await prisma.permission.findMany({ select: { code: true } })).map(p => p.code)
      : (await prisma.rolePermission.findMany({
          where: { role: user.role },
          include: { permission: true }
        })).map(rp => rp.permission.code)

    const { password, ...userWithoutPassword } = user

    return successResponse({
      user: userWithoutPassword,
      permissions: permissionCodes
    })
  } catch (e: any) {
    return errorResponse(e.message, 500)
  }
})
