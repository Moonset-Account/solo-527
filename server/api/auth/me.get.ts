import { requireAuth } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  return successResponse(user, '获取用户信息成功')
})
