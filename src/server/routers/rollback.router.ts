import { z } from "zod";
import { createTRPCRouter, protectedProcedure, itManagerProcedure, adminProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntity, RollbackStatus } from "@prisma/client";

const filterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  keyword: z.string().nullish(),
  status: z.nativeEnum(RollbackStatus).nullish(),
  assetId: z.string().nullish(),
  responsibleUserId: z.string().nullish(),
  groupByOwner: z.boolean().default(false),
});

const exportFilterSchema = filterSchema.omit({ page: true, pageSize: true, groupByOwner: true });

export const rollbackRouter = createTRPCRouter({
  list: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      const { page, pageSize, keyword, status, assetId, responsibleUserId, groupByOwner } = input;
      const where: Record<string, unknown> = {};
      if (keyword) where.title = { contains: keyword, mode: "insensitive" };
      if (status) where.status = status;
      if (assetId) where.assetId = assetId;
      if (responsibleUserId) where.responsibleUserId = responsibleUserId;

      const include = {
        asset: { select: { id: true, name: true, ipAddress: true } },
        approver: { select: { id: true, name: true } },
        executedBy: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true, email: true } },
      };

      if (groupByOwner) {
        const owners = await prisma.user.findMany({
          where: responsibleUserId ? { id: responsibleUserId } : {},
          include: {
            rollbackPlans: { where, include, orderBy: { createdAt: "desc" } },
          },
          orderBy: { name: "asc" },
        });
        const unassigned = await prisma.rollbackPlan.findMany({
          where: { ...where, responsibleUserId: null },
          include,
          orderBy: { createdAt: "desc" },
        });
        const total = owners.reduce((s, o) => s + o.rollbackPlans.length, 0) + unassigned.length;
        return {
          grouped: [
            ...owners.filter(o => o.rollbackPlans.length > 0).map(o => ({ owner: { id: o.id, name: o.name, email: o.email }, items: o.rollbackPlans })),
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
        prisma.rollbackPlan.count({ where }),
        prisma.rollbackPlan.findMany({
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

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.rollbackPlan.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          asset: { select: { id: true, name: true, ipAddress: true, hostname: true } },
          approver: { select: { id: true, name: true, email: true } },
          executedBy: { select: { id: true, name: true, email: true } },
          responsible: { select: { id: true, name: true, email: true } },
        },
      });
    }),

  create: itManagerProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().nullish(),
      assetId: z.string(),
      changeReason: z.string().nullish(),
      rollbackSteps: z.any().nullish(),
      riskAssessment: z.string().nullish(),
      responsibleUserId: z.string().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.rollbackPlan.create({ data: input });
      await createAuditLog({
        action: AuditAction.CREATE,
        entity: AuditEntity.ROLLBACK_PLAN,
        entityId: item.id,
        assetId: item.assetId,
        newValue: item,
        user: ctx.user,
      });
      return item;
    }),

  update: itManagerProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        title: z.string().min(1).optional(),
        description: z.string().nullish().optional(),
        status: z.nativeEnum(RollbackStatus).optional(),
        changeReason: z.string().nullish().optional(),
        rollbackSteps: z.any().nullish().optional(),
        riskAssessment: z.string().nullish().optional(),
        executedByUserId: z.string().nullish().optional(),
        responsibleUserId: z.string().nullish().optional(),
        executedAt: z.coerce.date().nullish().optional(),
        completedAt: z.coerce.date().nullish().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.rollbackPlan.findUniqueOrThrow({ where: { id: input.id } });
      const updates: Record<string, unknown> = { ...input.data };
      if (input.data.status === RollbackStatus.IN_PROGRESS && !old.executedAt) updates.executedAt = new Date();
      if (input.data.status === RollbackStatus.COMPLETED && !old.completedAt) updates.completedAt = new Date();
      const updated = await prisma.rollbackPlan.update({
        where: { id: input.id },
        data: updates,
      });
      await createAuditLog({
        action: AuditAction.UPDATE,
        entity: AuditEntity.ROLLBACK_PLAN,
        entityId: updated.id,
        assetId: updated.assetId,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
      });
      return updated;
    }),

  approve: adminProcedure
    .input(z.object({ id: z.string(), note: z.string().nullish() }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.rollbackPlan.findUniqueOrThrow({ where: { id: input.id } });
      const updated = await prisma.rollbackPlan.update({
        where: { id: input.id },
        data: {
          status: RollbackStatus.APPROVED,
          approverUserId: ctx.user.id,
          approvedAt: new Date(),
        },
      });
      await createAuditLog({
        action: AuditAction.APPROVE,
        entity: AuditEntity.ROLLBACK_PLAN,
        entityId: updated.id,
        assetId: updated.assetId,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
        note: input.note ?? "审批通过",
      });
      return updated;
    }),

  export: protectedProcedure
    .input(exportFilterSchema)
    .mutation(async ({ input, ctx }) => {
      const { keyword, status, assetId, responsibleUserId } = input;
      const where: Record<string, unknown> = {};
      if (keyword) where.title = { contains: keyword, mode: "insensitive" };
      if (status) where.status = status;
      if (assetId) where.assetId = assetId;
      if (responsibleUserId) where.responsibleUserId = responsibleUserId;

      const items = await prisma.rollbackPlan.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, ipAddress: true } },
          approver: { select: { id: true, name: true } },
          executedBy: { select: { id: true, name: true } },
          responsible: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      await createAuditLog({
        action: AuditAction.EXPORT,
        entity: AuditEntity.ROLLBACK_PLAN,
        user: ctx.user,
        note: `导出回滚方案数据，共 ${items.length} 条`,
      });

      return items;
    }),
});
