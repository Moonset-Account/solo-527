import { z } from "zod";
import { createTRPCRouter, protectedProcedure, itManagerProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { AlertSeverity, AlertStatus, AuditAction, AuditEntity } from "@prisma/client";

const filterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  keyword: z.string().nullish(),
  severity: z.nativeEnum(AlertSeverity).nullish(),
  status: z.nativeEnum(AlertStatus).nullish(),
  assetId: z.string().nullish(),
  assigneeId: z.string().nullish(),
  businessConfirmed: z.boolean().nullish(),
  dateFrom: z.coerce.date().nullish(),
  dateTo: z.coerce.date().nullish(),
  groupByAssignee: z.boolean().default(false),
});

const exportFilterSchema = filterSchema.omit({ page: true, pageSize: true, groupByAssignee: true });

export const alertRouter = createTRPCRouter({
  list: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      const { page, pageSize, keyword, severity, status, assetId, assigneeId, businessConfirmed, dateFrom, dateTo, groupByAssignee } = input;
      const where: Record<string, unknown> = {};
      if (keyword) where.title = { contains: keyword, mode: "insensitive" };
      if (severity) where.severity = severity;
      if (status) where.status = status;
      if (assetId) where.assetId = assetId;
      if (assigneeId) where.assigneeId = assigneeId;
      if (businessConfirmed !== null && businessConfirmed !== undefined) where.businessConfirmed = businessConfirmed;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) (where.createdAt as Record<string, unknown>).gte = dateFrom;
        if (dateTo) (where.createdAt as Record<string, unknown>).lte = dateTo;
      }

      const include = {
        asset: { select: { id: true, name: true, ipAddress: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      };

      if (groupByAssignee) {
        const assignees = await prisma.user.findMany({
          where: assigneeId ? { id: assigneeId } : {},
          include: {
            alertsAssigned: { where, include, orderBy: { createdAt: "desc" } },
          },
          orderBy: { name: "asc" },
        });
        const unassigned = await prisma.alert.findMany({
          where: { ...where, assigneeId: null },
          include,
          orderBy: { createdAt: "desc" },
        });
        const total = assignees.reduce((s, a) => s + a.alertsAssigned.length, 0) + unassigned.length;
        return {
          grouped: [
            ...assignees.filter(a => a.alertsAssigned.length > 0).map(a => ({ owner: { id: a.id, name: a.name, email: a.email }, items: a.alertsAssigned })),
            ...(unassigned.length > 0 ? [{ owner: { id: "unassigned", name: "未分配", email: "" }, items: unassigned }] : []),
          ],
          items: [],
          total,
          page,
          pageSize,
          totalPages: 1,
        };
      }

      const [total, items] = await Promise.all([
        prisma.alert.count({ where }),
        prisma.alert.findMany({
          where,
          include,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
      ]);
      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        grouped: [],
      };
    }),

  stats: protectedProcedure
    .query(async () => {
      const statusCounts = await prisma.alert.groupBy({
        by: ["status"],
        _count: { id: true },
      });
      const severityCounts = await prisma.alert.groupBy({
        by: ["severity"],
        _count: { id: true },
      });
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const trendRaw = await prisma.alert.groupBy({
        by: ["status", "createdAt"],
        _count: { id: true },
        where: { createdAt: { gte: last30Days } },
      });
      const trendByDate = new Map<string, number>();
      for (const r of trendRaw) {
        const d = r.createdAt.toISOString().slice(0, 10);
        trendByDate.set(d, (trendByDate.get(d) || 0) + r._count.id);
      }
      const trend = Array.from(trendByDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));
      const open = statusCounts.find(s => s.status === AlertStatus.OPEN)?._count.id ?? 0;
      const inProgress = statusCounts.find(s => s.status === AlertStatus.IN_PROGRESS)?._count.id ?? 0;
      const resolved = statusCounts.find(s => s.status === AlertStatus.RESOLVED)?._count.id ?? 0;
      return {
        statusCounts,
        severityCounts,
        trend,
        open,
        inProgress,
        resolved,
        total: statusCounts.reduce((s, r) => s + r._count.id, 0),
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.alert.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          asset: { select: { id: true, name: true, ipAddress: true, hostname: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          histories: {
            orderBy: { createdAt: "desc" },
            include: { actor: { select: { id: true, name: true } } },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      severity: z.nativeEnum(AlertSeverity),
      description: z.string().nullish(),
      source: z.string().nullish(),
      assetId: z.string().nullish(),
      assigneeId: z.string().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const alert = await prisma.alert.create({
        data: { ...input, creatorId: ctx.user.id },
      });
      await prisma.alertHistory.create({
        data: { alertId: alert.id, toStatus: AlertStatus.OPEN, actorId: ctx.user.id, note: "创建告警" },
      });
      await createAuditLog({
        action: AuditAction.CREATE,
        entity: AuditEntity.ALERT,
        entityId: alert.id,
        assetId: alert.assetId ?? undefined,
        newValue: alert,
        user: ctx.user,
      });
      return alert;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(AlertStatus),
      note: z.string().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.alert.findUniqueOrThrow({ where: { id: input.id } });
      const updates: Record<string, unknown> = { status: input.status };
      const now = new Date();
      if (input.status === AlertStatus.ACKNOWLEDGED && !old.acknowledgedAt) updates.acknowledgedAt = now;
      if (input.status === AlertStatus.RESOLVED && !old.resolvedAt) updates.resolvedAt = now;
      if (input.status === AlertStatus.CLOSED && !old.closedAt) updates.closedAt = now;

      const updated = await prisma.alert.update({ where: { id: input.id }, data: updates });
      await prisma.alertHistory.create({
        data: {
          alertId: updated.id,
          fromStatus: old.status,
          toStatus: input.status,
          note: input.note,
          actorId: ctx.user.id,
        },
      });
      await createAuditLog({
        action: AuditAction.UPDATE,
        entity: AuditEntity.ALERT,
        entityId: updated.id,
        assetId: updated.assetId ?? undefined,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
        note: input.note ?? `状态变更为 ${input.status}`,
      });
      return updated;
    }),

  confirmBusiness: protectedProcedure
    .input(z.object({ id: z.string(), confirmedBy: z.string(), note: z.string().nullish() }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.alert.findUniqueOrThrow({ where: { id: input.id } });
      const updated = await prisma.alert.update({
        where: { id: input.id },
        data: {
          businessConfirmed: true,
          businessConfirmedBy: input.confirmedBy,
          businessConfirmedAt: new Date(),
        },
      });
      await createAuditLog({
        action: AuditAction.CONFIRM,
        entity: AuditEntity.ALERT,
        entityId: updated.id,
        assetId: updated.assetId ?? undefined,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
        note: `业务确认由 ${input.confirmedBy} 完成。${input.note ?? ""}`,
      });
      return updated;
    }),

  setResolution: protectedProcedure
    .input(z.object({ id: z.string(), resolution: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.alert.findUniqueOrThrow({ where: { id: input.id } });
      const updated = await prisma.alert.update({
        where: { id: input.id },
        data: { resolution: input.resolution },
      });
      await createAuditLog({
        action: AuditAction.UPDATE,
        entity: AuditEntity.ALERT,
        entityId: updated.id,
        assetId: updated.assetId ?? undefined,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
        note: "更新解决说明",
      });
      return updated;
    }),

  assign: itManagerProcedure
    .input(z.object({ id: z.string(), assigneeId: z.string().nullish() }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.alert.findUniqueOrThrow({ where: { id: input.id } });
      const updated = await prisma.alert.update({
        where: { id: input.id },
        data: { assigneeId: input.assigneeId },
      });
      await createAuditLog({
        action: AuditAction.UPDATE,
        entity: AuditEntity.ALERT,
        entityId: updated.id,
        assetId: updated.assetId ?? undefined,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
        note: input.assigneeId ? `指派给用户 ${input.assigneeId}` : "取消指派",
      });
      return updated;
    }),

  export: protectedProcedure
    .input(exportFilterSchema)
    .mutation(async ({ input, ctx }) => {
      const { keyword, severity, status, assetId, assigneeId, businessConfirmed, dateFrom, dateTo } = input;
      const where: Record<string, unknown> = {};
      if (keyword) where.title = { contains: keyword, mode: "insensitive" };
      if (severity) where.severity = severity;
      if (status) where.status = status;
      if (assetId) where.assetId = assetId;
      if (assigneeId) where.assigneeId = assigneeId;
      if (businessConfirmed !== null && businessConfirmed !== undefined) where.businessConfirmed = businessConfirmed;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) (where.createdAt as Record<string, unknown>).gte = dateFrom;
        if (dateTo) (where.createdAt as Record<string, unknown>).lte = dateTo;
      }

      const items = await prisma.alert.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, ipAddress: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      await createAuditLog({
        action: AuditAction.EXPORT,
        entity: AuditEntity.ALERT,
        user: ctx.user,
        note: `导出告警数据，共 ${items.length} 条`,
      });
      return items;
    }),
});
