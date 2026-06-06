import Task, { TaskStatus, TaskType } from '~/server/models/Task'
import Point from '~/server/models/Point'
import type { IUser } from '~/server/models/User'
import { requireAuth, generateTaskNumber } from '~/server/utils/auth'
import { UserRole } from '~/server/models/User'

export default requireAuth(async (event, user: IUser) => {
  if (user.role !== UserRole.GRID_MEMBER && user.role !== UserRole.STREET_ADMIN) {
    throw createError({
      statusCode: 403,
      message: '只有网格员和街道管理员可以提交任务'
    })
  }
  
  const body = await readBody(event)
  const { pointId, type, description, beforePhotos } = body
  
  if (!pointId || !type || !description) {
    throw createError({
      statusCode: 400,
      message: '点位、类型和描述不能为空'
    })
  }
  
  const point = await Point.findById(pointId)
  if (!point) {
    throw createError({
      statusCode: 404,
      message: '点位不存在'
    })
  }
  
  const config = useRuntimeConfig()
  const deadlineHours = Number(config.public.taskDeadlineHours) || 24
  const deadline = new Date()
  deadline.setHours(deadline.getHours() + deadlineHours)
  
  const taskNumber = generateTaskNumber()
  
  const photosWithMetadata = (beforePhotos || []).map((photo: any) => ({
    ...photo,
    uploadedBy: user._id,
    uploadedAt: new Date()
  }))
  
  const task = await Task.create({
    taskNumber,
    type,
    pointId: point._id,
    pointName: point.name,
    community: point.community,
    submitterId: user._id,
    submitterName: user.name,
    description,
    beforePhotos: photosWithMetadata,
    status: TaskStatus.SUBMITTED,
    propertyCompany: point.propertyCompany,
    deadline,
    history: [{
      status: TaskStatus.SUBMITTED,
      changedBy: user._id,
      changedByName: user.name,
      changedAt: new Date(),
      note: '任务提交'
    }]
  })
  
  return task
})
