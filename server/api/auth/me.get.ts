import { verifyToken } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const { password, ...userWithoutPassword } = user
  return successResponse(userWithoutPassword)
})
