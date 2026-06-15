import { mockPrisma, successResponse } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const list = await mockPrisma.customerLevel.findMany()
  return successResponse({ list, total: list.length })
})
