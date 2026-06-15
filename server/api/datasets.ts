import { getDatasets } from '~/server/utils/mockData'
import type { Dataset } from '~/types'

let datasets: Dataset[] = getDatasets()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)

  if (method === 'GET') {
    const businessLine = query.businessLine as string
    let result = [...datasets]
    
    if (businessLine) {
      result = result.filter(d => d.businessLine === businessLine)
    }

    return {
      items: result,
      total: result.length
    }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const newDataset: Dataset = {
      id: 'ds_' + Date.now(),
      ...body,
      createdAt: new Date().toISOString()
    }
    datasets.unshift(newDataset)
    return newDataset
  }
})
