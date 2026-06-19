import { z } from "zod";
import { createTRPCRouter, protectedProcedure, itManagerProcedure, adminProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntity, AssetType, AssetStatus, UserRole } from "@prisma/client";

const assetInputSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AssetType),
  ipAddress: z.string().nullish(),
  hostname: z.string().nullish(),
  location: z.string().nullish(),
  status: z.nativeEnum(AssetStatus).default(AssetStatus.RUNNING),
  description: z.string().nullish(),
  ownerId: z.string().nullish(),
});

const listFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  keyword: z.string().nullish(),
  type: z.nativeEnum(AssetType).nullish(),
  status: z.nativeEnum(AssetStatus).nullish(),
  ownerId: z.string().nullish(),
  groupByOwner: z.boolean().default(false),
});

export const assetRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listFilterSchema)
    .query(async ({ input, ctx }) => {
      const { page, pageSize, keyword, type, status, ownerId, groupByOwner } = input;
      const where: Record<string, unknown> = {};
      if (keyword) {
        where.OR = [
          { name: { contains: keyword, mode: "insensitive" } },
          { ipAddress: { contains: keyword, mode: "insensitive" } },
          { hostname: { contains: keyword, mode: "insensitive" } },
        ];
      }
      if (type) where.type = type;
      if (status) where.status = status;
      if (ownerId) where.ownerId = ownerId;

      const include = {
        owner: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { alerts: true, vulnerabilities: true, inspections: true, rollbackPlans: true, configItems: true } },
      };

      if (groupByOwner) {
        const owners = await prisma.user.findMany({
          where: ownerId ? { id: ownerId } : { role: { in: [UserRole.IT_MANAGER, UserRole.ADMIN, UserRole.USER] } },
          include: {
            assetsOwned: { where, include, orderBy: { name: "asc" } },
          },
          orderBy: { name: "asc" },
        });
        const unassigned = await prisma.asset.findMany({
          where: { ...where, ownerId: null },
          include,
          orderBy: { name: "asc" },
        });
        const total = owners.reduce((s, o) => s + o.assetsOwned.length, 0) + unassigned.length;
        return {
          grouped: [
            ...owners.filter(o => o.assetsOwned.length > 0).map(o => ({ owner: { id: o.id, name: o.name, email: o.email }, items: o.assetsOwned })),
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
        prisma.asset.count({ where }),
        prisma.asset.findMany({
          where,
          include,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { updatedAt: "desc" },
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
      return prisma.asset.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          configItems: { orderBy: [{ category: "asc" }, { key: "asc" }] },
          alerts: {
            take: 20,
            orderBy: { createdAt: "desc" },
            include: { assignee: { select: { id: true, name: true } } },
          },
          vulnerabilities: {
            take: 20,
            orderBy: { createdAt: "desc" },
          },
          inspections: {
            take: 20,
            orderBy: { scheduledAt: "desc" },
          },
          rollbackPlans: {
            take: 20,
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }),

  create: itManagerProcedure
    .input(assetInputSchema)
    .mutation(async ({ input, ctx }) => {
      const asset = await prisma.asset.create({ data: input });
      await createAuditLog({
        action: AuditAction.CREATE,
        entity: AuditEntity.ASSET,
        entityId: asset.id,
        assetId: asset.id,
        newValue: asset,
        user: ctx.user,
      });
      return asset;
    }),

  update: itManagerProcedure
    .input(z.object({ id: z.string(), data: assetInputSchema.partial() }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.asset.findUniqueOrThrow({ where: { id: input.id } });
      const updated = await prisma.asset.update({
        where: { id: input.id },
        data: input.data,
      });
      await createAuditLog({
        action: AuditAction.UPDATE,
        entity: AuditEntity.ASSET,
        entityId: updated.id,
        assetId: updated.id,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
      });
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.asset.findUniqueOrThrow({ where: { id: input.id } });
      await prisma.asset.delete({ where: { id: input.id } });
      await createAuditLog({
        action: AuditAction.DELETE,
        entity: AuditEntity.ASSET,
        entityId: input.id,
        oldValue: old,
        user: ctx.user,
      });
      return { success: true };
    }),

  export: protectedProcedure
    .input(listFilterSchema.omit({ page: true, pageSize: true, groupByOwner: true }).extend({ pageSize: z.literal(10000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const { keyword, type, status, ownerId } = input;
      const where: Record<string, unknown> = {};
      if (keyword) {
        where.OR = [
          { name: { contains: keyword, mode: "insensitive" } },
          { ipAddress: { contains: keyword, mode: "insensitive" } },
          { hostname: { contains: keyword, mode: "insensitive" } },
        ];
      }
      if (type) where.type = type;
      if (status) where.status = status;
      if (ownerId) where.ownerId = ownerId;

      const items = await prisma.asset.findMany({
        where,
        include: { owner: { select: { id: true, name: true, email: true } } },
        orderBy: { name: "asc" },
      });

      await createAuditLog({
        action: AuditAction.EXPORT,
        entity: AuditEntity.ASSET,
        user: ctx.user,
        note: `导出资产数据，共 ${items.length} 条`,
      });

      return items;
    }),
});
