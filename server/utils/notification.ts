import { prisma } from '../plugins/prisma'
import { useRedis } from '../plugins/redis'

interface NotifyOptions {
  userId: number
  type: 'alert' | 'approval' | 'system'
  title: string
  content: string
  alertId?: number
  changeId?: number
}

export async function createNotification(options: NotifyOptions) {
  const notification = await prisma.notification.create({
    data: {
      userId: options.userId,
      type: options.type,
      title: options.title,
      content: options.content,
      alertId: options.alertId,
      changeId: options.changeId
    }
  })

  const redis = useRedis()
  if (redis) {
    try {
      await redis.publish(`notify:user:${options.userId}`, JSON.stringify(notification))
    } catch (e) {
      console.error('Redis publish failed:', e)
    }
  }

  return notification
}

export async function notifyAdmins(options: Omit<NotifyOptions, 'userId'>) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true }
  })

  for (const admin of admins) {
    await createNotification({ ...options, userId: admin.id })
  }
}
