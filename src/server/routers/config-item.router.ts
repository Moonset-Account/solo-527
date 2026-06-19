import { z } from "zod";
import { createTRPCRouter, protectedProcedure, itManagerProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, AuditEntity } from "@prisma/client";

export const configItemRouter = createTRPCRouter({
  listByAsset: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ input }) => {
      return prisma.configItem.findMany({
        where: { assetId: input.assetId },
        orderBy: [{ category: "asc" }, { key: "asc" }],
      });
    }),

  create: itManagerProcedure
    .input(z.object({
      assetId: z.string(),
      category: z.string().min(1),
      key: z.string().min(1),
      value: z.string().nullish(),
      description: z.string().nullish(),
      version: z.string().nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.configItem.create({
        data: { ...input, lastModifiedAt: new Date() },
      });
      await createAuditLog({
        action: AuditAction.CREATE,
        entity: AuditEntity.CONFIG_ITEM,
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
        category: z.string().min(1).optional(),
        key: z.string().min(1).optional(),
        value: z.string().nullish(),
        description: z.string().nullish(),
        version: z.string().nullish(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.configItem.findUniqueOrThrow({ where: { id: input.id } });
      const updated = await prisma.configItem.update({
        where: { id: input.id },
        data: { ...input.data, lastModifiedAt: new Date() },
      });
      await createAuditLog({
        action: AuditAction.UPDATE,
        entity: AuditEntity.CONFIG_ITEM,
        entityId: updated.id,
        assetId: updated.assetId,
        oldValue: old,
        newValue: updated,
        user: ctx.user,
      });
      return updated;
    }),

  delete: itManagerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const old = await prisma.configItem.findUniqueOrThrow({ where: { id: input.id } });
      await prisma.configItem.delete({ where: { id: input.id } });
      await createAuditLog({
        action: AuditAction.DELETE,
        entity: AuditEntity.CONFIG_ITEM,
        entityId: input.id,
        assetId: old.assetId,
        oldValue: old,
        user: ctx.user,
      });
      return { success: true };
    }),
});
