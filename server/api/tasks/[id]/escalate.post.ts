import Task, { TaskStatus } from '~/server/models/Task'
import User, { UserRole, type IUser } from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'

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
  
  if (task.isEscalated) {
    throw createError({
      statusCode: 400,
      message: '任务已升级'
    })
  }
  
  task.isEscalated = true
  task.escalationReason = reason || '逾期未处理'
  task.escalationTime = new Date()
  task.status = TaskStatus.ESCALATED
  
  const supervisor = await User.findOne({
    role: UserRole.STREET_ADMIN,
    community: task.community
  })
  
  task.history.push({
    status: TaskStatus.ESCALATED,
    changedBy: user._id,
    changedByName: user.name,
    changedAt: new Date(),
    note: `任务升级：${reason || '逾期未处理'}，已通知网格负责人`
  })
  
  await task.save()
  return task
})
