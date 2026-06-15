import prisma from '../utils/prisma'
import redis from '../utils/redis'

export async function checkOverdueWorkOrders() {
  const now = new Date()

  const overdueOrders = await prisma.workOrder.findMany({
    where: {
      deadline: {
        lt: now
      },
      status: {
        notIn: ['COMPLETED', 'CLOSED', 'REVIEWED', 'OVERDUE']
      }
    },
    include: {
      creator: true,
      assignments: {
        include: {
          assignee: true
        }
      }
    }
  })

  for (const order of overdueOrders) {
    await prisma.workOrder.update({
      where: { id: order.id },
      data: { status: 'OVERDUE' }
    })

    const remindedUserIds = [
      order.creatorId,
      ...order.assignments.map(a => a.assigneeId)
    ].filter(Boolean)

    const reminder = await prisma.overdueReminder.create({
      data: {
        workOrderId: order.id,
        reminderType: 'OVERDUE',
        content: `工单【${order.title}】已超期，截止时间为 ${order.deadline}，请尽快处理！`,
        remindedUserIds: JSON.stringify(remindedUserIds)
      }
    })

    await redis.publish('workorder:notifications', JSON.stringify({
      type: 'OVERDUE',
      workOrderId: order.id,
      workOrderTitle: order.title,
      reminderId: reminder.id,
      userIds: remindedUserIds,
      timestamp: now.toISOString()
    }))
  }

  return {
    checked: overdueOrders.length,
    markedOverdue: overdueOrders.length
  }
}

export async function checkUpcomingDeadlines() {
  const now = new Date()
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const upcomingOrders = await prisma.workOrder.findMany({
    where: {
      deadline: {
        gt: now,
        lt: twentyFourHoursLater
      },
      status: {
        notIn: ['COMPLETED', 'CLOSED', 'REVIEWED', 'OVERDUE']
      }
    },
    include: {
      creator: true,
      assignments: {
        include: {
          assignee: true
        }
      }
    }
  })

  for (const order of upcomingOrders) {
    const cacheKey = `reminder:upcoming:${order.id}`
    const reminded = await redis.get(cacheKey)

    if (!reminded) {
      const remindedUserIds = [
        order.creatorId,
        ...order.assignments.map(a => a.assigneeId)
      ].filter(Boolean)

      const reminder = await prisma.overdueReminder.create({
        data: {
          workOrderId: order.id,
          reminderType: 'UPCOMING',
          content: `工单【${order.title}】将在24小时内到期，截止时间为 ${order.deadline}，请抓紧处理！`,
          remindedUserIds: JSON.stringify(remindedUserIds)
        }
      })

      await redis.setex(cacheKey, 24 * 60 * 60, '1')

      await redis.publish('workorder:notifications', JSON.stringify({
        type: 'UPCOMING',
        workOrderId: order.id,
        workOrderTitle: order.title,
        reminderId: reminder.id,
        userIds: remindedUserIds,
        timestamp: now.toISOString()
      }))
    }
  }

  return {
    checked: upcomingOrders.length,
    reminded: upcomingOrders.length
  }
}

export function startOverdueChecker() {
  setInterval(async () => {
    try {
      await checkOverdueWorkOrders()
      await checkUpcomingDeadlines()
    } catch (error) {
      console.error('Error checking overdue work orders:', error)
    }
  }, 5 * 60 * 1000)

  console.log('Overdue checker started, running every 5 minutes')
}
