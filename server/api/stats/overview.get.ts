import Task, { TaskStatus, TaskType } from '~/server/models/Task'
import Point from '~/server/models/Point'
import User, { UserRole } from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'

export default requireAuth(async (event) => {
  const query = getQuery(event)
  const { status, type, community, startDate, endDate } = query
  
  const baseFilter: any = {}
  if (status) baseFilter.status = status
  if (type) baseFilter.type = type
  if (community) baseFilter.community = community
  if (startDate || endDate) {
    baseFilter.createdAt = {}
    if (startDate) baseFilter.createdAt.$gte = new Date(startDate as string)
    if (endDate) {
      const end = new Date(endDate as string)
      end.setHours(23, 59, 59, 999)
      baseFilter.createdAt.$lte = end
    }
  }
  
  const pendingFilter = { 
    ...baseFilter, 
    status: { $in: [TaskStatus.SUBMITTED, TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS] } 
  }
  const reviewFilter = { ...baseFilter, status: TaskStatus.PENDING_REVIEW }
  const closedFilter = { ...baseFilter, status: TaskStatus.CLOSED }
  const rejectedFilter = { ...baseFilter, status: TaskStatus.REJECTED }
  const escalatedFilter = { ...baseFilter, isEscalated: true }
  
  const totalTasks = await Task.countDocuments(baseFilter)
  const pendingTasks = await Task.countDocuments(pendingFilter)
  const pendingReview = await Task.countDocuments(reviewFilter)
  const closedTasks = await Task.countDocuments(closedFilter)
  const rejectedTasks = await Task.countDocuments(rejectedFilter)
  const escalatedTasks = await Task.countDocuments(escalatedFilter)
  const totalPoints = await Point.countDocuments()
  const activePoints = await Point.countDocuments({ status: 'active' })
  const totalUsers = await User.countDocuments({ role: { $ne: UserRole.PUBLIC } })
  
  const taskTypeStats = await Task.aggregate([
    { $match: baseFilter },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ])
  
  const communityStats = await Task.aggregate([
    { $match: baseFilter },
    { $group: { 
      _id: '$community', 
      total: { $sum: 1 },
      closed: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.CLOSED] }, 1, 0] } },
      missedSort: { $sum: { $cond: [{ $eq: ['$type', TaskType.MISSED_SORT] }, 1, 0] } },
      binFull: { $sum: { $cond: [{ $eq: ['$type', TaskType.BIN_FULL] }, 1, 0] } },
      pointDamaged: { $sum: { $cond: [{ $eq: ['$type', TaskType.POINT_DAMAGED] }, 1, 0] } }
    }}
  ])
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const trendFilter = { ...baseFilter, createdAt: { $gte: last7Days } }
  if (baseFilter.createdAt?.$gte) {
    trendFilter.createdAt.$gte = baseFilter.createdAt.$gte
  }
  if (baseFilter.createdAt?.$lte) {
    trendFilter.createdAt.$lte = baseFilter.createdAt.$lte
  }
  
  const dailyTrend = await Task.aggregate([
    { $match: trendFilter },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      submitted: { $sum: 1 },
      closed: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.CLOSED] }, 1, 0] } }
    }},
    { $sort: { _id: 1 } }
  ])
  
  return {
    summary: {
      totalTasks,
      pendingTasks,
      pendingReview,
      closedTasks,
      rejectedTasks,
      escalatedTasks,
      totalPoints,
      activePoints,
      totalUsers
    },
    taskTypeStats,
    communityStats,
    dailyTrend
  }
})
