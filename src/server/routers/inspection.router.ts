import { z } from "zod";
import { createTRPCRouter, protectedProcedure, itManagerProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntity, InspectionStatus } from "@prisma/client";

const filterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  keyword: z.string().nullish(),
  status: z.nativeEnum(InspectionStatus).nullish(),
  assetId: z.string().nullish(),
  responsibleUserId: z.string().nullish(),
  groupByOwner: z.boolean().default(false),
});

const exportFilterSchema = filterSchema.omit({ page: true, pageSize: true, groupByOwner: true });

export const inspectionRouter = createTRPCRouter({
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
        inspector: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true, email: true } },
      };

      if (groupByOwner) {
        const owners = await prisma.user.findMany({
          where: responsibleUserId ? { id: responsibleUserId } : {},
          include: {
            inspections: { where, include, orderBy: { scheduledAt: "desc" } },
          },
          orderBy: { name: "asc" },
        });
        const unassigned = await prisma.inspection.findMany({
          where: { ...where, responsibleUserId: null },
          include,
          orderBy: { scheduledAt: "desc" },
        });
        const total = owners.reduce((s, o) => s + o.inspections.length, 0) + unassigned.length;
        return {
          grouped: [
            ...owners.filter(o => o.inspections.length > 0).map(o => ({ owner: { id: o.id, name: o.name, email: o.email }, items: o.inspections })),
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
        prisma.inspection.count({ where }),
        prisma.inspection.findMany({
          where,
          include,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { scheduledAt: "desc" },
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
      return prisma.inspection.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          asset: { select: { id: true, name: true, ipAddress: true, hostname: true } },
          inspector: { select: { id: true, name: true, email: true } },
          responsible: { select: { id: true, name: true, email: true } },
        },
      });
    }),

  create: itManagerProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().nullish(),
      assetId: z.string(),
      scheduledAt: z.coerce.date(),
      inspectorUserId: z.string().nullish(),
      responsibleUserId: z.string().nullish(),
      checklist: z.any().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.inspection.create({ data: input });
      await createAuditLog({
        action: AuditAction.CREATE,
        entity: AuditEntity.INSPECTION,
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
        status: z.nativeEnum(InspectionStatus).optional(),
        scheduledAt: z.coerce.date().optional(),
        startedAt: z.coerce.date().nullish().optional(),
        completedAt: z.coerce.date().nullish().optional(),
        inspectorUserId: z.string().nullish().optional(),
        responsibleUserId: z.string().nullish().optional(),
        checklist: z.any().nullish().optional(),
        result: z.string().nullish().optional(),
        issuesFound: z.string().nullish().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.inspection.findUniqueOrThrow({ where: { id: input.id } });
      const updated = await prisma.inspection.update({
        where: { id: input.id },
        data: input.data,
      });
      await createAuditLog({
        action: AuditAction.UPDATE,
        entity: AuditEntity.INSPECTION,
        entityId: updated.id,
        assetId: updated.assetId,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
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

      const items = await prisma.inspection.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, ipAddress: true } },
          inspector: { select: { id: true, name: true } },
          responsible: { select: { id: true, name: true, email: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });

      await createAuditLog({
        action: AuditAction.EXPORT,
        entity: AuditEntity.INSPECTION,
        user: ctx.user,
        note: `导出巡检数据，共 ${items.length} 条`,
      });

      return items;
    }),
});
