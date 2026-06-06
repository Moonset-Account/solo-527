import Task, { TaskStatus } from '~/server/models/Task'
import type { IUser } from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'
import { UserRole } from '~/server/models/User'

export default requireAuth(async (event, user: IUser) => {
  if (user.role !== UserRole.STREET_ADMIN) {
    throw createError({
      statusCode: 403,
      message: '只有街道管理员可以复查'
    })
  }
  
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { result, reason, photos } = body
  
  if (!result || !['pass', 'fail'].includes(result)) {
    throw createError({
      statusCode: 400,
      message: '复查结果必须是 pass 或 fail'
    })
  }
  
  const task = await Task.findById(id)
  
  if (!task) {
    throw createError({
      statusCode: 404,
      message: '任务不存在'
    })
  }
  
  if (task.status !== TaskStatus.PENDING_REVIEW) {
    throw createError({
      statusCode: 400,
      message: '只有待复查的任务可以进行复查'
    })
  }
  
  const reviewPhotos = (photos || []).map((photo: any) => ({
    ...photo,
    uploadedBy: user._id,
    uploadedAt: new Date()
  }))
  
  const reviewRecord = {
    reviewerId: user._id,
    reviewerName: user.name,
    result,
    reason,
    photos: reviewPhotos,
    reviewedAt: new Date()
  }
  
  task.reviewRecords.push(reviewRecord as any)
  
  if (result === 'pass') {
    task.status = TaskStatus.CLOSED
    task.history.push({
      status: TaskStatus.CLOSED,
      changedBy: user._id,
      changedByName: user.name,
      changedAt: new Date(),
      note: '复查通过，任务关闭'
    })
  } else {
    task.status = TaskStatus.REJECTED
    task.rejectReason = reason
    task.history.push({
      status: TaskStatus.REJECTED,
      changedBy: user._id,
      changedByName: user.name,
      changedAt: new Date(),
      note: `复查不通过：${reason || '需要重新整改'}`
    })
  }
  
  await task.save()
  return task
})
