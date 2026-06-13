import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "../trpc";

export const tagRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.customerTag.findMany({
      orderBy: [{ sort: "asc" }, { name: "asc" }],
      include: { _count: { select: { customers: true } } },
    }),
  }),

  create: managerProcedure
    .input(z.object({
      name: z.string(),
      color: z.string().default("#3b82f6"),
      sort: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.customerTag.create({ data: input });
    }),

  update: managerProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      color: z.string().optional(),
      sort: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      return ctx.db.customerTag.update({ where: { id }, data: rest });
    }),

  delete: managerProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.customerTag.delete({ where: { id: input } });
    }),
});
