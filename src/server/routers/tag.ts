import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "../trpc";
import { safeDbCall, assertDbAvailable } from "../lib/safeDb";

export const tagRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return safeDbCall(ctx, [], async () => {
      const tags = await ctx.db.customerTag.findMany({
        orderBy: [{ sort: "asc" }, { name: "asc" }],
        include: { _count: { select: { customers: true } } },
      });
      return tags.map((t) => ({
        ...t,
        _count: { customers: t._count.customers },
      }));
    }, "tag.list");
  }),

  create: managerProcedure
    .input(z.object({
      name: z.string(),
      color: z.string().default("#3b82f6"),
      sort: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "创建标签");
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
      assertDbAvailable(ctx, "更新标签");
      const { id, ...rest } = input;
      return ctx.db.customerTag.update({ where: { id }, data: rest });
    }),

  delete: managerProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "删除标签");
      return ctx.db.customerTag.delete({ where: { id: input } });
    }),
});
