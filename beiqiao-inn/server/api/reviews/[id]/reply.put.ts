import { prisma } from '~/server/utils/prisma'
import { isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!(await isDbAvailable())) {
    return { id, reply: body.reply, status: 'REPLIED' }
  }

  const review = await prisma.review.update({
    where: { id },
    data: {
      reply: body.reply,
      status: 'REPLIED',
    },
  })
  return review
})
