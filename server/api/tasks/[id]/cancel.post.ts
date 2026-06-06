import Task, { TaskStatus } from '~/server/models/Task'
import type { IUser } from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'
import { UserRole } from '~/server/models/User'

export default requireAuth(async (event, user: IUser) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { reason } = body
  
  const task = await Task.findById(id)
  
  if (!task) {
    throw createError({
      statusCode: 404,
      message: '任务不存在'
    })
  }
  
  if (task.submitterId.toString() !== user._id.toString() && user.role !== UserRole.STREET_ADMIN) {
    throw createError({
      statusCode: 403,
      message: '只能撤回自己提交的任务'
    })
  }
  
  if (task.status === TaskStatus.CLOSED || task.status === TaskStatus.CANCELLED) {
    throw createError({
      statusCode: 400,
      message: '当前任务状态无法撤回'
    })
  }
  
  task.status = TaskStatus.CANCELLED
  task.history.push({
    status: TaskStatus.CANCELLED,
    changedBy: user._id,
    changedByName: user.name,
    changedAt: new Date(),
    note: `任务撤回：${reason || '无原因'}`
  })
  
  await task.save()
  return task
})
