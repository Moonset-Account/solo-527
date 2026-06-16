import { z } from "zod";
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const ACTION_LABELS: Record<string, string> = {
  CREATED: "创建",
  STATUS_CHANGED: "状态变更",
  RESULT_UPDATED: "结果更新",
  ROOTCAUSE_UPDATED: "根因更新",
  VERSION_UPDATED: "版本更新",
  COMPLETED: "完成",
  RECORDED: "记录",
  KNOWLEDGE_LINKED: "关联知识",
  KNOWLEDGE_HIT_UPDATED: "知识命中更新",
  ASSIGNEE_CHANGED: "负责人变更",
  NOTE_ADDED: "添加备注",
  RATING_SUBMITTED: "提交评价",
  RATING_CREATED: "服务评价",
  IMPROVEMENT_LINKED: "关联改进",
  TODO_CREATED: "待办创建",
};

export const auditLogRouter = createTRPCRouter({
  list: supervisorProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        action: z.string().optional(),
        userId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, startDate, endDate, ...filters } = input;
      const where: Record<string, unknown> = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== undefined)
      );
      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        };
      }
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);
      return {
        items: items.map((item) => ({
          ...item,
          actionLabel: ACTION_LABELS[item.action] ?? item.action,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const log = await prisma.auditLog.findUnique({
        where: { id: input.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      if (!log) return null;
      return {
        ...log,
        actionLabel: ACTION_LABELS[log.action] ?? log.action,
      };
    }),

  getTimeline: protectedProcedure
    .input(
      z.object({
        entityId: z.string(),
        entityType: z.string(),
      })
    )
    .query(async ({ input }) => {
      const logs = await prisma.auditLog.findMany({
        where: {
          entityId: input.entityId,
          entityType: input.entityType,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      return logs.map((log) => ({
        ...log,
        actionLabel: ACTION_LABELS[log.action] ?? log.action,
      }));
    }),

  getStats: supervisorProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const [total, byAction, byEntity, byUser, byDay] = await Promise.all([
        prisma.auditLog.count({ where: { createdAt: { gte: startDate } } }),
        prisma.auditLog.groupBy({
          by: ["action"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),
        prisma.auditLog.groupBy({
          by: ["entityType"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),
        prisma.auditLog.groupBy({
          by: ["userId"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),
        prisma.auditLog.groupBy({
          by: ["createdAt"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      const userIds = byUser.map((u) => u.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      });

      const dailyStats: Record<string, number> = {};
      byDay.forEach((d) => {
        const day = d.createdAt.toISOString().split("T")[0];
        dailyStats[day] = (dailyStats[day] || 0) + d._count.id;
      });

      const dailyArray = Object.entries(dailyStats)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total,
        byAction: byAction.map((a) => ({
          action: a.action,
          actionLabel: ACTION_LABELS[a.action] ?? a.action,
          count: a._count.id,
        })),
        byEntity: byEntity.map((e) => ({
          entityType: e.entityType,
          count: e._count.id,
        })),
        byUser: byUser.map((u) => ({
          userId: u.userId,
          userName: users.find((us) => us.id === u.userId)?.name ?? "未知",
          count: u._count.id,
        })),
        dailyStats: dailyArray,
      };
    }),

  getEntityHistory: supervisorProcedure
    .input(
      z.object({
        entityId: z.string(),
        entityType: z.string(),
      })
    )
    .query(async ({ input }) => {
      const logs = await prisma.auditLog.findMany({
        where: {
          entityId: input.entityId,
          entityType: input.entityType,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      const changes: Array<{
        logId: string;
        action: string;
        actionLabel: string;
        userId: string;
        userName: string;
        timestamp: Date;
        field: string;
        oldValue: string | null;
        newValue: string | null;
      }> = [];

      logs.forEach((log) => {
        if (log.action === "CREATED") {
          try {
            const data = JSON.parse(log.newValue || "{}");
            Object.entries(data).forEach(([key, value]) => {
              changes.push({
                logId: log.id,
                action: log.action,
                actionLabel: ACTION_LABELS[log.action] ?? log.action,
                userId: log.userId,
                userName: log.user?.name ?? "未知",
                timestamp: log.createdAt,
                field: key,
                oldValue: null,
                newValue: String(value),
              });
            });
          } catch {
            changes.push({
              logId: log.id,
              action: log.action,
              actionLabel: ACTION_LABELS[log.action] ?? log.action,
              userId: log.userId,
              userName: log.user?.name ?? "未知",
              timestamp: log.createdAt,
              field: "创建",
              oldValue: null,
              newValue: log.newValue,
            });
          }
        } else if (log.oldValue !== null || log.newValue !== null) {
          let fieldName = "值";
          if (log.action === "STATUS_CHANGED") fieldName = "状态";
          else if (log.action === "RESULT_UPDATED") fieldName = "处理结果";
          else if (log.action === "ROOTCAUSE_UPDATED") fieldName = "根本原因";
          else if (log.action === "VERSION_UPDATED") fieldName = "版本";
          else if (log.action === "ASSIGNEE_CHANGED") fieldName = "负责人";

          changes.push({
            logId: log.id,
            action: log.action,
            actionLabel: ACTION_LABELS[log.action] ?? log.action,
            userId: log.userId,
            userName: log.user?.name ?? "未知",
            timestamp: log.createdAt,
            field: fieldName,
            oldValue: log.oldValue,
            newValue: log.newValue,
          });
        }
      });

      return {
        logs: logs.map((log) => ({
          ...log,
          actionLabel: ACTION_LABELS[log.action] ?? log.action,
        })),
        changes,
      };
    }),
});
