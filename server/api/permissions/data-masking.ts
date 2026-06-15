import { getDataMaskingConfigs } from '~/server/utils/mockData'
import type { DataMaskingConfig } from '~/types'

let configs: DataMaskingConfig[] = getDataMaskingConfigs()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method === 'GET') {
    return configs
  }

  if (method === 'PATCH') {
    const body = await readBody(event)
    const index = configs.findIndex(c => c.id === body.id)
    
    if (index !== -1) {
      configs[index] = { ...configs[index], ...body }
      return configs[index]
    }
    
    throw createError({
      statusCode: 404,
      statusMessage: '配置不存在'
    })
  }
})
