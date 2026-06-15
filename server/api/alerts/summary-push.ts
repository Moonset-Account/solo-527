import { getSummaryPushes } from '~/server/utils/mockData'
import type { SummaryPush } from '~/types'

let pushes: SummaryPush[] = getSummaryPushes()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)

  if (method === 'GET') {
    const userId = query.userId as string
    if (userId) {
      return pushes.filter(p => p.userId === userId)
    }
    return pushes
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const newPush: SummaryPush = {
      id: 'sp_' + Date.now(),
      ...body,
      enabled: true,
      createdAt: new Date().toISOString()
    }
    pushes.unshift(newPush)
    return newPush
  }
})
