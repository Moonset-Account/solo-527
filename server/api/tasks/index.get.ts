import Task from '~/server/models/Task'
import type { IUser } from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'
import { UserRole } from '~/server/models/User'

export default requireAuth(async (event, user: IUser) => {
  const query = getQuery(event)
  const { 
    status, 
    type, 
    community, 
    propertyCompany,
    pointId,
    startDate,
    endDate,
    isEscalated,
    page = 1, 
    limit = 20 
  } = query
  
  const filter: any = {}
  
  if (status) filter.status = status
  if (type) filter.type = type
  if (community) filter.community = community
  if (propertyCompany) filter.propertyCompany = propertyCompany
  if (pointId) filter.pointId = pointId
  if (isEscalated !== undefined) filter.isEscalated = isEscalated === 'true'
  
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate as string)
    if (endDate) {
      const end = new Date(endDate as string)
      end.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = end
    }
  }
  
  if (user.role === UserRole.PROPERTY) {
    filter.propertyCompany = user.propertyCompany
  }
  
  if (user.role === UserRole.GRID_MEMBER) {
    filter.submitterId = user._id
  }
  
  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .populate('pointId', 'name address community')
  
  const total = await Task.countDocuments(filter)
  
  return {
    tasks,
    total,
    page: Number(page),
    limit: Number(limit)
  }
})
