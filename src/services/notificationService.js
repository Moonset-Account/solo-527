import { BaseFirestoreService } from './baseService'
import { COLLECTIONS } from '@/models/schemas'

class NotificationService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.NOTIFICATIONS)
  }

  async createNotification(userId, title, content, type = 'info', relatedId = null, relatedType = null) {
    return this.create({
      userId,
      title,
      content,
      type,
      relatedId,
      relatedType,
      read: false,
      readAt: null
    })
  }

  async getNotificationsByUser(userId, unreadOnly = false) {
    const conditions = []
    conditions.push(['userId', '==', userId])
    if (unreadOnly) {
      conditions.push(['read', '==', false])
    }
    
    return this.getAll({
      where: conditions,
      orderBy: ['createdAt', 'desc']
    })
  }

  async getUnreadCount(userId) {
    const notifications = await this.getAll({
      where: [
        ['userId', '==', userId],
        ['read', '==', false]
      ]
    })
    return notifications.length
  }

  async markAsRead(notificationId) {
    return this.update(notificationId, {
      read: true,
      readAt: new Date()
    })
  }

  async markAllAsRead(userId) {
    const notifications = await this.getNotificationsByUser(userId, true)
    const updates = notifications.map(n => this.markAsRead(n.id))
    await Promise.all(updates)
    return { success: true, count: notifications.length }
  }

  async notifyRotationReminder(userId, rotationId, rotationDate) {
    return this.createNotification(
      userId,
      '轮值任务提醒',
      `您有一项轮值任务将于 ${rotationDate} 执行，请准时参加`,
      'reminder',
      rotationId,
      'rotation'
    )
  }

  async notifyConsecutiveAbsences(userId, absenceCount) {
    return this.createNotification(
      userId,
      '连续缺席提醒',
      `您已连续缺席 ${absenceCount} 次轮值任务，请留意后续准时参加，多次缺席可能影响您的认领资格`,
      'warning'
    )
  }

  async notifyAdminConsecutiveAbsences(adminId, userName, absenceCount) {
    return this.createNotification(
      adminId,
      '用户连续缺席提醒',
      `用户 ${userName} 已连续缺席 ${absenceCount} 次轮值任务，请关注`,
      'warning'
    )
  }

  async notifyClaimStatus(userId, claimId, status) {
    const statusText = {
      approved: '已通过',
      rejected: '已拒绝',
      cancelled: '已取消'
    }
    return this.createNotification(
      userId,
      `认领申请${statusText[status]}`,
      `您的认领申请${statusText[status]}`,
      'info',
      claimId,
      'claim'
    )
  }

  async notifyNewAnnouncement(userId, announcementId, title) {
    return this.createNotification(
      userId,
      '新公告发布',
      title,
      'info',
      announcementId,
      'announcement'
    )
  }

  async notifyToolOverdue(userId, borrowId, toolName) {
    return this.createNotification(
      userId,
      '工具逾期提醒',
      `您借用的 ${toolName} 已逾期，请尽快归还`,
      'warning',
      borrowId,
      'toolBorrow'
    )
  }
}

export const notificationService = new NotificationService()
