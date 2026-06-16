import { prisma } from '~/server/utils/prisma'
import { createApiError, handlePrismaError } from '~/server/utils/apiError'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { appointmentId, amount, method, items } = body

    if (!appointmentId || !amount || !method) {
      return createApiError({
        statusCode: 400,
        statusMessage: '缺少必填字段',
      })
    }

    const validMethods = ['CASH', 'WECHAT', 'ALIPAY', 'CARD']
    if (!validMethods.includes(method)) {
      return createApiError({
        statusCode: 400,
        statusMessage: '无效的支付方式',
      })
    }

    const payment = await prisma.payment.create({
      data: {
        appointmentId,
        amount,
        method,
        items: {
          create: (items || []).map((item: { name: string; price: number; quantity: number }) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
          })),
        },
      },
      include: {
        appointment: true,
        items: true,
      },
    })

    return { success: true, data: payment }
  } catch (error) {
    handlePrismaError(error, '创建支付')
  }
})
