import { getPermissionApplications } from '~/server/utils/mockData'
import type { PermissionApplication } from '~/types'

let applications: PermissionApplication[] = getPermissionApplications()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const query = getQuery(event)

  if (method === 'GET') {
    const status = query.status as string
    let result = [...applications]
    
    if (status) {
      result = result.filter(a => a.status === status)
    }

    return {
      items: result,
      total: result.length
    }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const newApp: PermissionApplication = {
      id: 'app_' + Date.now(),
      ...body,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    applications.unshift(newApp)
    return newApp
  }
})
