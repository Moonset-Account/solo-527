import Task, { TaskStatus } from '~/server/models/Task'
import Point from '~/server/models/Point'

export default defineEventHandler(async () => {
  const totalTasks = await Task.countDocuments()
  const closedTasks = await Task.countDocuments({ status: TaskStatus.CLOSED })
  const totalPoints = await Point.countDocuments({ status: 'active' })
  
  const communityStats = await Task.aggregate([
    { $group: { 
      _id: '$community', 
      total: { $sum: 1 },
      closed: { $sum: { $cond: [{ $eq: ['$status', TaskStatus.CLOSED] }, 1, 0] } },
      missedSort: { $sum: { $cond: [{ $eq: ['$type', 'missed_sort'] }, 1, 0] } },
      binFull: { $sum: { $cond: [{ $eq: ['$type', 'bin_full'] }, 1, 0] } },
      pointDamaged: { $sum: { $cond: [{ $eq: ['$type', 'point_damaged'] }, 1, 0] } }
    }},
    { $project: {
      community: '$_id',
      total: 1,
      closed: 1,
      completionRate: { $round: [{ $multiply: [{ $divide: ['$closed', '$total'] }, 100] }, 2] },
      typeBreakdown: {
        missedSort: '$missedSort',
        binFull: '$binFull',
        pointDamaged: '$pointDamaged'
      }
    }}
  ])
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const dailyTrend = await Task.aggregate([
    { $match: { createdAt: { $gte: last30Days } } },
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
      closedTasks,
      completionRate: totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0,
      totalPoints
    },
    communityStats,
    dailyTrend
  }
})
