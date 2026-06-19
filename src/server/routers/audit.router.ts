import { z } from "zod";
import { createTRPCRouter, itManagerProcedure, adminProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { AuditAction, AuditEntity } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

export const auditRouter = createTRPCRouter({
  list: itManagerProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      entity: z.nativeEnum(AuditEntity).nullish(),
      action: z.nativeEnum(AuditAction).nullish(),
      assetId: z.string().nullish(),
      entityId: z.string().nullish(),
      userId: z.string().nullish(),
      keyword: z.string().nullish(),
      dateFrom: z.coerce.date().nullish(),
      dateTo: z.coerce.date().nullish(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, entity, action, assetId, entityId, userId, keyword, dateFrom, dateTo } = input;
      const where: Record<string, unknown> = {};
      if (entity) where.entity = entity;
      if (action) where.action = action;
      if (assetId) where.assetId = assetId;
      if (entityId) where.entityId = entityId;
      if (userId) where.userId = userId;
      if (keyword) where.note = { contains: keyword, mode: "insensitive" };
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) (where.createdAt as Record<string, unknown>).gte = dateFrom;
        if (dateTo) (where.createdAt as Record<string, unknown>).lte = dateTo;
      }

      const [total, items] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          include: {
            asset: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, email: true, role: true } },
          },
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
      };
    }),

  export: adminProcedure
    .input(z.object({
      entity: z.nativeEnum(AuditEntity).nullish(),
      action: z.nativeEnum(AuditAction).nullish(),
      assetId: z.string().nullish(),
      userId: z.string().nullish(),
      dateFrom: z.coerce.date().nullish(),
      dateTo: z.coerce.date().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { entity, action, assetId, userId, dateFrom, dateTo } = input;
      const where: Record<string, unknown> = {};
      if (entity) where.entity = entity;
      if (action) where.action = action;
      if (assetId) where.assetId = assetId;
      if (userId) where.userId = userId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) (where.createdAt as Record<string, unknown>).gte = dateFrom;
        if (dateTo) (where.createdAt as Record<string, unknown>).lte = dateTo;
      }

      const items = await prisma.auditLog.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      await createAuditLog({
        action: AuditAction.EXPORT,
        entity: AuditEntity.USER,
        user: ctx.user,
        note: `导出操作日志，共 ${items.length} 条`,
      });
      return items;
    }),
});
