import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const userRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ includeRoles: z.array(z.nativeEnum(UserRole)).optional() }))
    .query(async ({ input }) => {
      return prisma.user.findMany({
        where: input.includeRoles ? { role: { in: input.includeRoles } } : {},
        orderBy: { name: "asc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          phone: true,
          createdAt: true,
          _count: {
            select: {
              assetsOwned: true,
              alertsAssigned: true,
            },
          },
        },
      });
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.user;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().nullish().optional(),
        role: z.nativeEnum(UserRole).optional(),
        department: z.string().nullish().optional(),
        phone: z.string().nullish().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      return prisma.user.update({
        where: { id: input.id },
        data: input.data,
      });
    }),
});
