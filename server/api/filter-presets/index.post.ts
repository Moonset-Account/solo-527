import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse, errorResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)
  const body = await readBody(event)
  const { name, pageKey, filters, sortBy, sortOrder, isDefault } = body

  if (!name || !pageKey || !filters) {
    return errorResponse('请填写完整信息')
  }

  if (isDefault) {
    await prisma.filterPreset.updateMany({
      where: {
        userId: user.id,
        pageKey
      },
      data: { isDefault: false }
    })
  }

  const preset = await prisma.filterPreset.create({
    data: {
      name,
      userId: user.id,
      pageKey,
      filters: JSON.stringify(filters),
      sortBy,
      sortOrder,
      isDefault: isDefault || false
    }
  })

  return successResponse({
    ...preset,
    filters: JSON.parse(preset.filters)
  }, '筛选方案保存成功')
})
