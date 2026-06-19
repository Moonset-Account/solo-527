import { readBody, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const inspectionId = getRouterParam(event, 'id')
  if (!inspectionId) {
    throw createError({ statusCode: 400, message: '缺少巡检ID' })
  }

  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
  })

  if (!inspection) {
    throw createError({ statusCode: 404, message: '巡检不存在' })
  }

  const body = await readBody(event)
  const { photos } = body

  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    throw createError({ statusCode: 400, message: '请选择要上传的照片' })
  }

  const createdPhotos = []
  for (const photo of photos) {
    const created = await prisma.inspectionPhoto.create({
      data: {
        inspectionId,
        url: photo.url || `/uploads/inspections/${inspectionId}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        category: photo.category || '现场照片',
        description: photo.description || '',
      },
    })
    createdPhotos.push(created)
  }

  return {
    success: true,
    data: createdPhotos,
    count: createdPhotos.length,
  }
})
