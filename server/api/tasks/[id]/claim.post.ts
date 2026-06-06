import Task, { TaskStatus } from '~/server/models/Task'
import type { IUser } from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'
import { UserRole } from '~/server/models/User'

export default requireAuth(async (event, user: IUser) => {
  if (user.role !== UserRole.PROPERTY) {
    throw createError({
      statusCode: 403,
      message: '只有物业可以认领任务'
    })
  }
  
  const id = getRouterParam(event, 'id')
  const task = await Task.findById(id)
  
  if (!task) {
    throw createError({
      statusCode: 404,
      message: '任务不存在'
    })
  }
  
  if (task.propertyCompany !== user.propertyCompany) {
    throw createError({
      statusCode: 403,
      message: '只能认领本物业公司的任务'
    })
  }
  
  if (task.status !== TaskStatus.SUBMITTED && task.status !== TaskStatus.REJECTED) {
    throw createError({
      statusCode: 400,
      message: '当前任务状态无法认领'
    })
  }
  
  task.status = TaskStatus.CLAIMED
  task.assigneeId = user._id
  task.assigneeName = user.name
  task.history.push({
    status: TaskStatus.CLAIMED,
    changedBy: user._id,
    changedByName: user.name,
    changedAt: new Date(),
    note: '物业认领任务'
  })
  
  await task.save()
  return task
})
