import { createTRPCRouter, publicProcedure } from "@/trpc/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const tenantRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ search: z.string().optional(), buildingId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search } },
          { contact: { contains: input.search } },
          { phone: { contains: input.search } },
        ];
      }
      return prisma.tenant.findMany({
        where,
        include: { rooms: { include: { building: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.tenant.findUnique({
        where: { id: input.id },
        include: {
          rooms: { include: { building: true } },
          contracts: { include: { room: { include: { building: true } } } },
          serviceRequests: { orderBy: { createdAt: "desc" }, take: 10 },
          bills: { orderBy: { createdAt: "desc" }, take: 10 },
          repairs: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      contact: z.string(),
      phone: z.string(),
      email: z.string().optional(),
      industry: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.tenant.create({ data: input });
    }),

  update: publicProcedure
    .input(z.object({ id: z.string() }).and(z.object({
      name: z.string().optional(),
      contact: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      industry: z.string().optional(),
      status: z.string().optional(),
    })))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.tenant.update({ where: { id }, data });
    }),
});
