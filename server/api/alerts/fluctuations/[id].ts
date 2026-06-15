import { getFluctuationLogs } from '~/server/utils/mockData'
import { useFluctuationsStore, findFluctuationIndex, findFluctuation, upsertFluctuation } from '~/server/utils/fluctuationsStore'
import type { Fluctuation } from '~/types'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const id = event.context.params?.id as string
  const fluctuationsData = useFluctuationsStore()

  if (method === 'GET') {
    const fluctuation = findFluctuation(id)
    if (!fluctuation) {
      throw createError({
        statusCode: 404,
        statusMessage: '异常记录不存在'
      })
    }
    const logs = getFluctuationLogs(id)
    return {
      ...fluctuation,
      logs
    }
  }

  if (method === 'PATCH') {
    const body = await readBody(event)
    const index = findFluctuationIndex(id)

    if (index === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: '异常记录不存在'
      })
    }

    const allowedFields = ['status', 'assigneeId', 'assigneeName', 'priority', 'deadline'] as const
    const update: Partial<Fluctuation> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (update as any)[field] = body[field]
      }
    }

    if (body.status === 'processing' && fluctuationsData[index].status === 'pending') {
      update.status = 'processing'
    }

    return upsertFluctuation(id, update)
  }
})
