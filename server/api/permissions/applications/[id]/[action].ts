import { getPermissionApplications } from '~/server/utils/mockData'
import type { PermissionApplication } from '~/types'

let applications: PermissionApplication[] = getPermissionApplications()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const id = event.context.params?.id as string
  const action = event.context.params?.action as string

  const index = applications.findIndex(a => a.id === id)
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: '申请不存在'
    })
  }

  if (method === 'POST' && action === 'approve') {
    const body = await readBody(event)
    applications[index] = {
      ...applications[index],
      status: 'approved',
      approverId: body.approverId,
      approverName: body.approverName,
      approvalComment: body.comment,
      approvedAt: new Date().toISOString()
    }
    return { success: true, message: '已通过' }
  }

  if (method === 'POST' && action === 'reject') {
    const body = await readBody(event)
    applications[index] = {
      ...applications[index],
      status: 'rejected',
      approverId: body.approverId,
      approverName: body.approverName,
      approvalComment: body.comment
    }
    return { success: true, message: '已驳回' }
  }

  if (method === 'GET') {
    return applications[index]
  }
})
