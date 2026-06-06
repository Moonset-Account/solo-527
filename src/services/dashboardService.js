import { plotService } from './plotService'
import { claimService } from './claimService'
import { rotationService } from './rotationService'
import { toolService, toolBorrowService } from './toolService'
import { cropService } from './cropService'
import { harvestService } from './harvestService'
import { userService } from './userService'
import { COLLECTIONS, ROTATION_STATUS, CLAIM_STATUS } from '@/models/schemas'

class DashboardService {
  async getOverviewStats() {
    const [
      plotStats,
      claimStats,
      rotationStats,
      toolStats,
      cropStats,
      harvestStats,
      userStats
    ] = await Promise.all([
      plotService.getPlotStatistics(),
      claimService.getClaimStatistics(),
      rotationService.getRotationStatistics(),
      toolService.getToolStatistics(),
      cropService.getCropStatistics(),
      harvestService.getHarvestStatistics(),
      userService.getUserStatistics()
    ])

    return {
      plots: plotStats,
      claims: claimStats,
      rotations: rotationStats,
      tools: toolStats,
      crops: cropStats,
      harvests: harvestStats,
      users: userStats
    }
  }

  async getBottleneckAnalysis(filters = {}) {
    const bottlenecks = []

    const pendingClaims = await claimService.getPendingClaims()
    if (pendingClaims.length > 0) {
      bottlenecks.push({
        type: 'claims_pending',
        title: '待处理认领申请',
        count: pendingClaims.length,
        severity: pendingClaims.length > 5 ? 'high' : 'medium',
        description: `有 ${pendingClaims.length} 份认领申请等待审批`,
        actionUrl: '/claims'
      })
    }

    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const upcomingRotations = await rotationService.getAll({
      where: [
        ['date', '>=', now],
        ['date', '<=', threeDaysLater],
        ['status', '==', ROTATION_STATUS.PENDING]
      ]
    })

    bottlenecks.push({
      type: 'upcoming_rotations',
      title: '近期轮值任务',
      count: upcomingRotations.length,
      severity: upcomingRotations.length > 3 ? 'medium' : 'low',
      description: `未来3天有 ${upcomingRotations.length} 项轮值任务待执行`,
      actionUrl: '/rotation'
    })

    const overdueBorrows = await toolBorrowService.getOverdueBorrows()
    if (overdueBorrows.length > 0) {
      bottlenecks.push({
        type: 'tools_overdue',
        title: '逾期工具借用',
        count: overdueBorrows.length,
        severity: 'medium',
        description: `有 ${overdueBorrows.length} 件工具逾期未归还`,
        actionUrl: '/tools'
      })
    }

    const highAbsenceUsers = await userService.getUsersWithHighAbsences(3)
    if (highAbsenceUsers.length > 0) {
      bottlenecks.push({
        type: 'high_absences',
        title: '连续缺席用户',
        count: highAbsenceUsers.length,
        severity: 'high',
        description: `有 ${highAbsenceUsers.length} 位用户连续缺席3次以上轮值`,
        actionUrl: '/users'
      })
    }

    return bottlenecks
  }

  async getResourceUtilization() {
    const plotStats = await plotService.getPlotStatistics()
    const toolStats = await toolService.getToolStatistics()
    const rotationStats = await rotationService.getRotationStatistics()

    const rotationCompletionRate = rotationStats.total > 0 
      ? Math.round((rotationStats.completed / rotationStats.total) * 100) 
      : 100

    return [
      {
        name: '地块利用率',
        value: plotStats.utilizationRate,
        unit: '%',
        status: plotStats.utilizationRate < 50 ? 'low' : plotStats.utilizationRate < 80 ? 'medium' : 'high',
        description: `共有 ${plotStats.total} 块地，已认领 ${plotStats.claimed} 块`
      },
      {
        name: '工具使用率',
        value: toolStats.utilizationRate,
        unit: '%',
        status: toolStats.utilizationRate < 30 ? 'low' : toolStats.utilizationRate < 60 ? 'medium' : 'high',
        description: `工具总量 ${toolStats.totalQuantity}，可用 ${toolStats.availableQuantity}`
      },
      {
        name: '轮值完成率',
        value: rotationCompletionRate,
        unit: '%',
        status: rotationCompletionRate < 70 ? 'low' : rotationCompletionRate < 90 ? 'medium' : 'high',
        description: `共 ${rotationStats.total} 次轮值，完成 ${rotationStats.completed} 次`
      }
    ]
  }

  async getFilteredDashboardData(filters) {
    const { timeRange, status, assigneeId } = filters
    const now = new Date()
    let startDate, endDate

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      default:
        startDate = null
        endDate = null
    }

    let rotations = await rotationService.getAll()
    
    if (startDate && endDate) {
      rotations = rotations.filter(r => {
        const date = r.date?.seconds ? new Date(r.date.seconds * 1000) : new Date(r.date)
        return date >= startDate && date <= endDate
      })
    }
    
    if (status) {
      rotations = rotations.filter(r => r.status === status)
    }
    
    if (assigneeId) {
      rotations = rotations.filter(r => r.assigneeId === assigneeId)
    }

    let claims = await claimService.getAll()
    
    if (status) {
      claims = claims.filter(c => c.status === status)
    }
    
    if (startDate && endDate) {
      claims = claims.filter(c => {
        const date = c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000) : new Date(c.createdAt)
        return date >= startDate && date <= endDate
      })
    }

    return {
      rotations,
      claims,
      filters: { timeRange, status, assigneeId }
    }
  }
}

export const dashboardService = new DashboardService()
