import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, paginate } from '../../utils/helpers'
import { z } from 'zod'
import type { Role } from '@prisma/client'

const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COACH', 'STAFF', 'CUSTOMER']

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event, ['SUPER_ADMIN', 'ADMIN', 'MANAGER'])
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 20
    const keyword = query.keyword as string || ''
    const role = query.role as Role | undefined

    const where: any = {}
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { realName: { contains: keyword } },
        { phone: { contains: keyword } },
        { email: { contains: keyword } }
      ]
    }
    if (role && validRoles.includes(role)) {
      where.role = role
    }

    const result = await paginate(prisma.user, page, pageSize, where, { coachProfile: true })
    const safeList = result.list.map(({ password, ...rest }) => rest)

    return successResponse({ ...result, list: safeList })
  } catch (e: any) {
    return errorResponse(e.message || '获取用户列表失败', e.statusCode || 500)
  }
})
