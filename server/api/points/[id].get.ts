import Point from '~/server/models/Point'
import { requireAuth } from '~/server/utils/auth'

export default requireAuth(async (event) => {
  const id = getRouterParam(event, 'id')
  const point = await Point.findById(id)
  
  if (!point) {
    throw createError({
      statusCode: 404,
      message: '点位不存在'
    })
  }
  
  return point
})
