import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const inspectionId = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { title, description, responsiblePerson, deadline } = body

  if (!title || !description || !responsiblePerson || !deadline) {
    throw createError({
      statusCode: 400,
      statusMessage: '请填写完整的整改信息',
    })
  }

  const rectification = await prisma.rectification.create({
    data: {
      inspectionId,
      title,
      description,
      responsiblePerson,
      deadline: new Date(deadline),
      status: 'pending',
    },
  })

  await prisma.inspection.update({
    where: { id: inspectionId },
    data: { status: 'rectifying' },
  })

  return rectification
})
