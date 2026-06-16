import prisma from '../../utils/prisma'
import { withRetry } from '../../utils/retry'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await withRetry(async () => {
    return prisma.interviewer.create({
      data: {
        name: body.name,
        email: body.email,
        title: body.title,
        department: body.department
      }
    })
  }, {
    endpoint: '/api/interviewers',
    method: 'POST',
    requestBody: body
  })

  return result.data
})
