import { requireAuth } from '~/server/utils/response'
import { successResponse } from '~/server/utils/response'
import { usePrisma } from '~/server/plugins/prisma'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

  const prisma = usePrisma()
  const user = await prisma.user.findUnique({
    where: { id: BigInt(auth.userId) },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      phone: true,
      avatarUrl: true,
    },
  })

  return successResponse(user)
})
