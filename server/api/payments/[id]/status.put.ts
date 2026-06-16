import { prisma } from '~/server/utils/prisma'
import { redis } from '~/server/utils/redis'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      return createApiError({ statusCode: 400, statusMessage: '缺少支付ID' })
    }

    const body = await readBody(event)
    const { status } = body

    if (!status) {
      return createApiError({ statusCode: 400, statusMessage: '缺少支付状态' })
    }

    const existing = await prisma.payment.findUnique({ where: { id } })
    if (!existing) {
      return createApiError({ statusCode: 404, statusMessage: '支付记录不存在' })
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'PAID') {
      updateData.paidAt = new Date()
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        appointment: true,
        items: true,
      },
    })

    await redis.del('dashboard:stats')

    return { success: true, data: payment }
  } catch (error) {
    handlePrismaError(error, '更新支付状态')
  }
})
