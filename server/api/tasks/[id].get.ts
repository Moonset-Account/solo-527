import Task from '~/server/models/Task'
import { requireAuth } from '~/server/utils/auth'

export default requireAuth(async (event) => {
  const id = getRouterParam(event, 'id')
  const task = await Task.findById(id)
    .populate('pointId', 'name address community location binTypes contactPerson contactPhone')
  
  if (!task) {
    throw createError({
      statusCode: 404,
      message: '任务不存在'
    })
  }
  
  return task
})
