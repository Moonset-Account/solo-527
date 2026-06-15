import { prisma, Prisma } from '../lib/prisma';
import type { TaskPriority, TaskStatus } from '@/types';

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | 'unassigned';
  creatorId?: string;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export const taskService = {
  async list(filter: TaskFilter = {}) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.assigneeId === 'unassigned') where.assigneeId = null;
    else if (filter.assigneeId) where.assigneeId = filter.assigneeId;
    if (filter.creatorId) where.creatorId = filter.creatorId;
    if (filter.keyword) {
      where.OR = [
        { title: { contains: filter.keyword, mode: 'insensitive' } },
        { description: { contains: filter.keyword, mode: 'insensitive' } },
      ];
    }
    if (filter.fromDate || filter.toDate) {
      where.createdAt = {};
      if (filter.fromDate) where.createdAt.gte = new Date(filter.fromDate);
      if (filter.toDate) where.createdAt.lte = new Date(filter.toDate + 'T23:59:59');
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [total, items] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          assignee: { select: { id: true, name: true, department: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { progressRecords: true, delayReasons: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      items: items.map((t: any) => ({
        ...t,
        progressRecordsCount: t._count.progressRecords,
        delayReasonsCount: t._count.delayReasons,
        _count: undefined,
      })),
    };
  },

  async getById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, department: true, email: true } },
        creator: { select: { id: true, name: true, department: true } },
        meetingMinutes: true,
        progressRecords: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
        processNodes: {
          orderBy: { createdAt: 'asc' },
          include: { operator: { select: { id: true, name: true } } },
        },
        delayReasons: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
        reminders: {
          orderBy: { sentAt: 'desc' },
          take: 10,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });
  },

  async create(data: {
    title: string;
    description?: string;
    priority: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    meetingMinutesId?: string;
    creatorId: string;
  }) {
    const status: TaskStatus = data.assigneeId ? 'IN_PROGRESS' : 'PENDING_CLAIM';
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        meetingMinutesId: data.meetingMinutesId,
        creatorId: data.creatorId,
        processNodes: {
          create: {
            nodeName: data.assigneeId ? '事项派发' : '事项创建',
            toStatus: status,
            remark: data.assigneeId ? `已派发至责任人` : '进入待认领池',
            operatorId: data.creatorId,
          },
        },
        logs: {
          create: {
            action: 'TASK_CREATED',
            operatorId: data.creatorId,
            newValue: {
              title: data.title,
              priority: data.priority,
              status,
              assigneeId: data.assigneeId || null,
            } as Prisma.InputJsonValue,
          },
        },
      },
      include: { assignee: true, creator: true },
    });
    return task;
  },

  async claim(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('事项不存在');
    if (task.status !== 'PENDING_CLAIM') throw new Error('该事项不可认领');
    if (task.assigneeId) throw new Error('该事项已有责任人');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'IN_PROGRESS',
          assigneeId: userId,
          processNodes: {
            create: {
              nodeName: '事项认领',
              fromStatus: 'PENDING_CLAIM',
              toStatus: 'IN_PROGRESS',
              operatorId: userId,
            },
          },
        },
      });
      await tx.taskLog.create({
        data: {
          action: 'TASK_CLAIMED',
          taskId,
          operatorId: userId,
          newValue: { assigneeId: userId, status: 'IN_PROGRESS' } as Prisma.InputJsonValue,
        },
      });
      return updated;
    });
  },

  async updateProgress(
    taskId: string,
    userId: string,
    data: { progress: number; remark?: string; attachments?: string[] }
  ) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('事项不存在');
    if (task.assigneeId !== userId) throw new Error('仅责任人可补充进度');
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED')
      throw new Error('该事项已结束，无法更新进度');

    const newStatus: TaskStatus =
      data.progress >= 100
        ? 'COMPLETED'
        : task.status === 'PENDING_CLAIM'
          ? 'IN_PROGRESS'
          : (task.status as TaskStatus);

    return prisma.$transaction(async (tx) => {
      const updates: any = { progress: data.progress };
      if (newStatus !== task.status) {
        updates.status = newStatus;
        if (newStatus === 'COMPLETED') updates.completedAt = new Date();
      }

      const updated = await tx.task.update({
        where: { id: taskId },
        data: updates,
      });

      await tx.taskProgress.create({
        data: {
          taskId,
          userId,
          progress: data.progress,
          remark: data.remark,
          attachments: data.attachments ? JSON.stringify(data.attachments) : undefined,
        },
      });

      if (newStatus !== task.status) {
        await tx.processNode.create({
          data: {
            taskId,
            nodeName: newStatus === 'COMPLETED' ? '事项完成' : '状态变更',
            fromStatus: task.status,
            toStatus: newStatus,
            remark: data.remark,
            operatorId: userId,
          },
        });
      }

      await tx.taskLog.create({
        data: {
          action: newStatus === 'COMPLETED' ? 'TASK_COMPLETED' : 'PROGRESS_UPDATED',
          taskId,
          operatorId: userId,
          oldValue: { progress: task.progress, status: task.status } as Prisma.InputJsonValue,
          newValue: { progress: data.progress, status: newStatus } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  },

  async recordDelay(
    taskId: string,
    userId: string,
    data: { reason: string; expectedDate?: string }
  ) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('事项不存在');
    if (task.assigneeId !== userId) throw new Error('仅责任人可录入延期原因');

    return prisma.$transaction(async (tx) => {
      let updated = task;
      if (task.status !== 'DELAYED') {
        updated = await tx.task.update({
          where: { id: taskId },
          data: { status: 'DELAYED' },
        });
        await tx.processNode.create({
          data: {
            taskId,
            nodeName: '标记延期',
            fromStatus: task.status,
            toStatus: 'DELAYED',
            remark: data.reason.slice(0, 50),
            operatorId: userId,
          },
        });
      }
      const reason = await tx.delayReason.create({
        data: {
          taskId,
          userId,
          reason: data.reason,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        },
      });
      await tx.taskLog.create({
        data: {
          action: 'DELAY_RECORDED',
          taskId,
          operatorId: userId,
          newValue: {
            reason: data.reason,
            expectedDate: data.expectedDate || null,
            status: 'DELAYED',
          } as Prisma.InputJsonValue,
        },
      });
      return { task: updated, reason };
    });
  },

  async reassign(
    taskId: string,
    operatorId: string,
    data: { newAssigneeId: string; reason?: string }
  ) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('事项不存在');

    return prisma.$transaction(async (tx) => {
      const oldAssigneeId = task.assigneeId;
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          assigneeId: data.newAssigneeId,
          status: task.status === 'PENDING_CLAIM' ? 'IN_PROGRESS' : task.status,
          processNodes: {
            create: {
              nodeName: '责任人变更',
              fromStatus: task.status,
              toStatus: task.status === 'PENDING_CLAIM' ? 'IN_PROGRESS' : task.status,
              remark: data.reason,
              operatorId,
            },
          },
        },
        include: { assignee: { select: { id: true, name: true } } },
      });
      await tx.taskLog.create({
        data: {
          action: 'ASSIGNEE_CHANGED',
          taskId,
          operatorId,
          oldValue: { assigneeId: oldAssigneeId } as Prisma.InputJsonValue,
          newValue: { assigneeId: data.newAssigneeId, reason: data.reason || '' } as Prisma.InputJsonValue,
        },
      });
      return updated;
    });
  },

  async sendReminder(taskId: string, senderId: string, data: { content?: string; channel?: string }) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('事项不存在');
    if (!task.assigneeId) throw new Error('无责任人，无法发送催办');

    const content =
      data.content ||
      `【催办通知】您负责的事项「${task.title}」请尽快处理并更新进度。`;
    const channel = data.channel || 'IN_APP';

    return prisma.$transaction(async (tx) => {
      const reminder = await tx.reminder.create({
        data: {
          taskId,
          senderId,
          type: 'MANUAL',
          channel,
          content,
        },
      });
      await tx.task.update({
        where: { id: taskId },
        data: {
          remindCount: { increment: 1 },
          lastRemindedAt: new Date(),
        },
      });
      await tx.taskLog.create({
        data: {
          action: 'REMINDER_SENT',
          taskId,
          operatorId: senderId,
          newValue: { channel, content: content.slice(0, 100) } as Prisma.InputJsonValue,
        },
      });
      return reminder;
    });
  },
};
