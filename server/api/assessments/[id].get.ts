import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const assessment = await prisma.assessment.findUnique({ where: { id } })
  if (!assessment) {
    throw createError({ statusCode: 404, statusMessage: '测评不存在' })
  }

  return {
    ...assessment,
    changes: {
      scoreChange: assessment.scoreAfter !== null && assessment.scoreBefore !== null
        ? assessment.scoreAfter - assessment.scoreBefore
        : null,
      questionCountBefore: assessment.questionsBefore ? Object.keys(assessment.questionsBefore as object).length : 0,
      questionCountAfter: assessment.questionsAfter ? Object.keys(assessment.questionsAfter as object).length : 0
    }
  }
})
