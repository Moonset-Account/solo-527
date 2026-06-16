import prisma from './prisma'
import type { NotificationType, Notification } from '@prisma/client'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export const createNotification = async (
  params: CreateNotificationParams
): Promise<Notification> => {
  const { userId, type, title, message, metadata } = params

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata: metadata as Prisma.JsonValue | undefined,
    },
  })

  return notification
}

export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: {
      userId,
      status: 'UNREAD',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  })
}

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<Notification | null> => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      status: 'READ',
      readAt: new Date(),
    },
  }).then(() => {
    return prisma.notification.findUnique({ where: { id: notificationId } })
  })
}

export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      status: 'UNREAD',
    },
    data: {
      status: 'READ',
      readAt: new Date(),
    },
  })
  return result.count
}

export const checkAccuracyThreshold = async (): Promise<void> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const conversations = await prisma.conversation.findMany({
    where: {
      createdAt: {
        gte: today,
      },
      accuracyScore: {
        not: null,
      },
    },
  })

  if (conversations.length < 10) return

  const avgAccuracy = conversations.reduce((sum, c) => sum + (c.accuracyScore || 0), 0) / conversations.length

  if (avgAccuracy < 0.7) {
    const supervisors = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPERVISOR', 'ADMIN'],
        },
      },
    })

    for (const supervisor of supervisors) {
      await createNotification({
        userId: supervisor.id,
        type: 'ACCURACY_ALERT',
        title: '准确率告警',
        message: `今日平均准确率为 ${(avgAccuracy * 100).toFixed(1)}%，低于70%阈值，请及时关注。`,
        metadata: {
          avgAccuracy,
          threshold: 0.7,
          conversationCount: conversations.length,
        },
      })
    }
  }
}

export const checkKnowledgeExpiring = async (): Promise<void> => {
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

  const expiringKnowledge = await prisma.knowledgeBase.findMany({
    where: {
      status: 'ACTIVE',
      expireDate: {
        lte: sevenDaysLater,
        gt: new Date(),
      },
    },
    include: {
      owner: true,
    },
  })

  for (const knowledge of expiringKnowledge) {
    await createNotification({
      userId: knowledge.ownerId,
      type: 'KNOWLEDGE_EXPIRING',
      title: '知识即将过期提醒',
      message: `知识库条目"${knowledge.title}"将于${knowledge.expireDate?.toLocaleDateString('zh-CN')}过期，请及时处理。`,
      metadata: {
        knowledgeId: knowledge.id,
        expireDate: knowledge.expireDate,
      },
    })
  }
}

import type { JsonValue, Prisma } from '@prisma/client'
