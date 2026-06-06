import Task, { TaskStatus, TaskType } from '~/server/models/Task'
import Point from '~/server/models/Point'
import User, { UserRole } from '~/server/models/User'
import { requireAuth } from '~/server/utils/auth'

export default requireAuth(async () => {
  const totalTasks = await Task.countDocuments()
  const pendingTasks = await Task.countDocuments({ 
    status: { $in: [TaskStatus.SUBMITTED, TaskStatus.CLAIMED, TaskStatus.IN_PROGRESS] } 
  })
  const pendingReview = await Task.countDocuments({ status: TaskStatus.PENDING_REVIEW })
  const closedTasks = await Task.countDocuments({ status: TaskStatus.CLOSED })
  const rejectedTasks = await Task.countDocuments({ status: TaskStatus.REJECTED })
  const escalatedTasks = await Task.countDocuments({ isEscalated: true })
  const totalPoints = await Point.countDocuments()
  const activePoints = await Point.countDocuments({ status: 'active' })
  const totalUsers = await User.countDocuments({ role: { $ne: UserRole.PUBLIC } })
  
  const taskTypeStats = await Task.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ])
  
  const communityStats = await Task.aggregate([
    { $group: { 
      _id: '$community', 
      total: { $sum: 1 },
      closed: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.CLOSED] }, 1, 0] } }
    }}
  ])
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const dailyTrend = await Task.aggregate([
    { $match: { createdAt: { $gte: last7Days } } },
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
