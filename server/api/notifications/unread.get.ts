import prisma from '~/server/utils/prisma'
import { verifyToken } from '~/server/utils/auth'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const user = await verifyToken(event)

  const reminders = await prisma.overdueReminder.findMany({
    where: {
      isRead: false,
      remindedUserIds: {
        contains: user.id.toString()
      }
    },
    include: {
      workOrder: {
        select: {
          id: true,
          orderNo: true,
          title: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return successResponse({
    count: reminders.length,
    list: reminders
  })
})
