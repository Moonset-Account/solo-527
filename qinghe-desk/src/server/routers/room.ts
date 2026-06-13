import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const roomRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      buildingId: z.string().optional(),
      status: z.enum(["VACANT", "OCCUPIED", "MAINTENANCE"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      return prisma.room.findMany({
        where: input ?? {},
        include: { building: true, tenant: true },
        orderBy: [{ buildingId: "asc" }, { floor: "asc" }, { unitNumber: "asc" }],
      });
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.room.findUnique({
        where: { id: input.id },
        include: { building: true, tenant: true, contracts: true },
      });
    }),

  updatePrice: publicProcedure
    .input(z.object({ id: z.string(), price: z.number() }))
    .mutation(async ({ input }) => {
      const old = await prisma.room.findUnique({ where: { id: input.id } });
      const updated = await prisma.room.update({
        where: { id: input.id },
        data: { price: input.price },
      });
      if (old && old.price !== input.price) {
        await prisma.auditLog.create({
          data: {
            entityType: "Room",
            entityId: input.id,
            field: "price",
            oldValue: String(old.price),
            newValue: String(input.price),
            operatorId: "system",
          },
        });
      }
      return updated;
    }),

  updateStatus: publicProcedure
    .input(z.object({ id: z.string(), status: z.string(), tenantId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.room.update({ where: { id }, data });
    }),
});
