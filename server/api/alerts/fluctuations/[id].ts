import { getFluctuations, getFluctuationLogs } from '~/server/utils/mockData'
import type { Fluctuation } from '~/types'

let fluctuationsData: Fluctuation[] = getFluctuations()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const id = event.context.params?.id as string

  if (method === 'GET') {
    const fluctuation = fluctuationsData.find(f => f.id === id)
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
    const index = fluctuationsData.findIndex(f => f.id === id)
    
    if (index === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: '异常记录不存在'
      })
    }

    if (body.status === 'closed' && body.resolution) {
      fluctuationsData[index] = {
        ...fluctuationsData[index],
        status: 'closed',
        resolution: body.resolution,
        closedAt: new Date().toISOString()
      }
    } else {
      fluctuationsData[index] = {
        ...fluctuationsData[index],
        ...body
      }
    }

    return fluctuationsData[index]
  }

  if (method === 'POST' && event.node.req.url?.includes('/close')) {
    const body = await readBody(event)
    const index = fluctuationsData.findIndex(f => f.id === id)
    
    if (index === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: '异常记录不存在'
      })
    }

    fluctuationsData[index] = {
      ...fluctuationsData[index],
      status: 'closed',
      resolution: body.resolution,
      closedAt: new Date().toISOString()
    }

    return { success: true, message: '异常已关闭' }
  }
})
