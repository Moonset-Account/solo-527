import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      interviews: {
        include: {
          interviewer: true,
          checkIns: true,
          retryLogs: true
        },
        orderBy: { scheduledAt: 'desc' }
      },
      assessments: {
        orderBy: { createdAt: 'desc' }
      },
      stageHistory: {
        orderBy: { createdAt: 'desc' }
      },
      checkIns: {
        orderBy: { createdAt: 'desc' }
      },
      reminders: {
        orderBy: { createdAt: 'desc' }
      },
      noShows: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!candidate) {
    throw createError({ statusCode: 404, statusMessage: '候选人不存在' })
  }

  return candidate
})
