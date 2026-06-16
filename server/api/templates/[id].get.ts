import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return createApiError({ statusCode: 400, statusMessage: '缺少模板ID' })
    }

    const template = await prisma.inspectionTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return createApiError({ statusCode: 404, statusMessage: '模板不存在' })
    }

    return { success: true, data: template }
  } catch (error) {
    handlePrismaError(error, '查询检查模板详情')
  }
})
