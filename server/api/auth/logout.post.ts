import { requireAuth } from '../../utils/auth'
import { createLog } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  deleteCookie(event, 'auth_token', { path: '/' })

  const ip = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress
  await createLog({
    actionType: 'USER_LOGOUT',
    userId: user.id,
    ip: ip || 'unknown'
  })

  return { success: true }
})
