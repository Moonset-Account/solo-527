import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const log = await prisma.apiRetryLog.findUnique({
    where: { id },
    include: {
      interview: {
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          candidate: { select: { id: true, name: true, email: true } },
          interviewer: { select: { id: true, name: true } }
        }
      }
    }
  })

  if (!log) {
    throw createError({ statusCode: 404, statusMessage: '重试日志不存在' })
  }

  return log
})
