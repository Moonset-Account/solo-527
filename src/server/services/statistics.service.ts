import { prisma } from '../lib/prisma';
import type { OwnershipStat, TrendDataPoint } from '@/types';

export const statisticsService = {
  async getOwnershipStats(options?: {
    department?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<OwnershipStat[]> {
    const where: any = {};
    if (options?.fromDate) where.createdAt = { gte: new Date(options.fromDate) };
    if (options?.toDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(options.toDate + 'T23:59:59') };
    }

    const users = await prisma.user.findMany({
      where: options?.department
        ? { department: { contains: options.department } }
        : { active: true },
      select: { id: true, name: true, department: true },
      orderBy: { department: 'asc' },
    });

    const userIds = users.map((u) => u.id);
    const tasks = await prisma.task.findMany({
      where: { assigneeId: { in: userIds } },
      select: {
        id: true,
        status: true,
        assigneeId: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return users.map((user) => {
      const userTasks = tasks.filter((t) => t.assigneeId === user.id);
      const totalCount = userTasks.length;
      const completedCount = userTasks.filter((t) => t.status === 'COMPLETED').length;
      const delayedCount = userTasks.filter((t) => t.status === 'DELAYED').length;
      const inProgressCount = userTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const pendingClaimCount = userTasks.filter((t) => t.status === 'PENDING_CLAIM').length;

      const completedTasks = userTasks.filter(
        (t) => t.status === 'COMPLETED' && t.completedAt
      );
      const totalHours = completedTasks.reduce((sum, t) => {
        const hours =
          (t.completedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + Math.max(0, hours);
      }, 0);
      const avgProcessingHours =
        completedTasks.length > 0 ? Math.round((totalHours / completedTasks.length) * 10) / 10 : 0;

      return {
        userId: user.id,
        userName: user.name,
        department: user.department,
        totalCount,
        completedCount,
        delayedCount,
        inProgressCount,
        pendingClaimCount,
        completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 1000) / 10 : 0,
        delayRate: totalCount > 0 ? Math.round((delayedCount / totalCount) * 1000) / 10 : 0,
        avgProcessingHours,
      };
    });
  },

  async getDashboardStats() {
    const [total, inProgress, completed, delayed, pendingClaim] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.task.count({ where: { status: 'DELAYED' } }),
      prisma.task.count({ where: { status: 'PENDING_CLAIM' } }),
    ]);

    const delayRate = total > 0 ? Math.round((delayed / total) * 1000) / 10 : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    return { total, inProgress, completed, delayed, pendingClaim, delayRate, completionRate };
  },

  async getTrendData(weeks = 8): Promise<TrendDataPoint[]> {
    const result: TrendDataPoint[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const tasks = await prisma.task.findMany({
        where: { createdAt: { lte: weekEnd } },
        select: { id: true, status: true, createdAt: true, completedAt: true },
      });

      const weekNum = getWeekNumber(weekStart);
      result.push({
        label: `W${weekNum}`,
        pendingClaim: tasks.filter(
          (t) => t.createdAt <= weekEnd && t.status === 'PENDING_CLAIM'
        ).length,
        inProgress: tasks.filter(
          (t) =>
            t.createdAt <= weekEnd &&
            (t.status === 'IN_PROGRESS' ||
              (t.completedAt && t.completedAt > weekEnd && t.createdAt <= weekEnd))
        ).length,
        completed: tasks.filter(
          (t) => t.status === 'COMPLETED' && t.completedAt && t.completedAt <= weekEnd
        ).length,
        delayed: tasks.filter(
          (t) => t.createdAt <= weekEnd && t.status === 'DELAYED'
        ).length,
      });
    }

    return result;
  },

  async exportTasks(options: {
    format: 'csv' | 'xlsx';
    fromDate?: string;
    toDate?: string;
    assigneeId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (options.fromDate) where.createdAt = { gte: new Date(options.fromDate) };
    if (options.toDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(options.toDate + 'T23:59:59') };
    }
    if (options.assigneeId) where.assigneeId = options.assigneeId;
    if (options.status) where.status = options.status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { name: true, department: true } },
        creator: { select: { name: true } },
        _count: { select: { progressRecords: true, reminders: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const statusMap: Record<string, string> = {
      PENDING_CLAIM: '待认领',
      IN_PROGRESS: '进行中',
      DELAYED: '已延期',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    };
    const priorityMap: Record<string, string> = {
      LOW: '低',
      MEDIUM: '中',
      HIGH: '高',
      URGENT: '紧急',
    };

    return tasks.map((t) => ({
      ID: t.id,
      标题: t.title,
      描述: t.description || '',
      状态: statusMap[t.status] || t.status,
      优先级: priorityMap[t.priority] || t.priority,
      进度: `${t.progress}%`,
      责任人: t.assignee?.name || '(待认领)',
      部门: t.assignee?.department || '',
      创建人: t.creator.name,
      截止日期: t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
      创建时间: t.createdAt.toLocaleString('zh-CN'),
      完成时间: t.completedAt ? t.completedAt.toLocaleString('zh-CN') : '',
      催办次数: t._count.reminders,
      进度补充次数: t._count.progressRecords,
    }));
  },
};

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
