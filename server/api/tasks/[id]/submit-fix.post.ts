import Task, { TaskStatus } from '~/server/models/Task'
import type { IUser } from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'
import { UserRole } from '~/server/models/User'

export default requireAuth(async (event, user: IUser) => {
  if (user.role !== UserRole.PROPERTY) {
    throw createError({
      statusCode: 403,
      message: '只有物业可以提交整改'
    })
  }
  
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { afterPhotos, note } = body
  
  const task = await Task.findById(id)
  
  if (!task) {
    throw createError({
      statusCode: 404,
      message: '任务不存在'
    })
  }
  
  if (task.assigneeId?.toString() !== user._id.toString()) {
    throw createError({
      statusCode: 403,
      message: '只能处理您认领的任务'
    })
  }
  
  if (task.status !== TaskStatus.CLAIMED && task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.REJECTED) {
    throw createError({
      statusCode: 400,
      message: '当前任务状态无法提交整改'
    })
  }
  
  const newAfterPhotos = (afterPhotos || []).map((photo: any) => ({
    ...photo,
    uploadedBy: user._id,
    uploadedAt: new Date()
  }))
  
  task.afterPhotos = [...task.afterPhotos, ...newAfterPhotos]
  task.status = TaskStatus.PENDING_REVIEW
  
  task.history.push({
    status: TaskStatus.PENDING_REVIEW,
    changedBy: user._id,
    changedByName: user.name,
    changedAt: new Date(),
    note: note || '提交整改完成，等待复查'
  })
  
  await task.save()
  return task
})
