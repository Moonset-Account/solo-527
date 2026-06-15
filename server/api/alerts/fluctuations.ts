import { getFluctuations } from '~/server/utils/mockData'
import type { Fluctuation, FluctuationStatus, Priority } from '~/types'

let fluctuationsData: Fluctuation[] = getFluctuations()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)

  if (method === 'GET') {
    const status = query.status as FluctuationStatus | undefined
    const priority = query.priority as Priority | undefined
    const assigneeId = query.assigneeId as string | undefined
    const source = query.source as string | undefined

    let result = [...fluctuationsData]

    if (status) {
      result = result.filter(f => f.status === status)
    }
    if (priority) {
      result = result.filter(f => f.priority === priority)
    }
    if (assigneeId) {
      result = result.filter(f => f.assigneeId === assigneeId)
    }
    if (source) {
      result = result.filter(f => f.source === source)
    }

    return {
      items: result,
      total: result.length
    }
  }
})
