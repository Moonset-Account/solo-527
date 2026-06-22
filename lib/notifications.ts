import { prisma } from "./prisma";
import { isOverdue } from "./utils";
import type { NotificationType, RepairStatus } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  referenceType?: string,
  referenceId?: string,
  repairId?: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      referenceType,
      referenceId,
      repairId,
    },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function getUserNotifications(userId: string, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      include: {
        repair: {
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function checkOverdueRepairs() {
  const now = new Date();

  const overdueRepairs = await prisma.repair.findMany({
    where: {
      status: {
        in: ["REPORTED", "IN_PROGRESS"],
      },
      deadline: {
        lt: now,
      },
      NOT: {
        status: "OVERDUE",
      },
    },
    include: {
      project: {
        include: {
          designer: true,
        },
      },
    },
  });

  const bosses = await prisma.user.findMany({
    where: { role: "BOSS" },
    select: { id: true, name: true },
  });

  const results = [];

  for (const repair of overdueRepairs) {
    await prisma.repair.update({
      where: { id: repair.id },
      data: { status: "OVERDUE" as RepairStatus },
    });

    for (const boss of bosses) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: boss.id,
          repairId: repair.id,
          type: "REPAIR_OVERDUE",
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!existingNotification) {
        const notification = await createNotification(
          boss.id,
          "REPAIR_OVERDUE",
          `返修超时提醒: ${repair.title}`,
          `项目 "${repair.project.name}" 的返修任务 "${repair.title}" 已超过截止日期 ${repair.deadline.toLocaleDateString()}。请及时处理。`,
          "Repair",
          repair.id,
          repair.id
        );
        results.push({ repairId: repair.id, bossId: boss.id, notificationId: notification.id });
      }
    }
  }

  return {
    processed: overdueRepairs.length,
    notificationsSent: results.length,
    details: results,
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}
