import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "../trpc";
import { safeDbCall, assertDbAvailable } from "../lib/safeDb";

export const stageRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return safeDbCall(ctx, [], () =>
      ctx.db.followUpStage.findMany({
        where: { isActive: true },
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }] as any,
      }),
      "stage.list"
    );
  }),

  listAll: managerProcedure.query(async ({ ctx }) => {
    return safeDbCall(ctx, [], () =>
      ctx.db.followUpStage.findMany({
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }] as any,
        include: { _count: { select: { leads: true, rules: true } } },
      }),
      "stage.listAll"
    );
  }),

  create: managerProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      color: z.string().default("#3b82f6"),
      sort: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "创建阶段");
      return ctx.db.followUpStage.create({ data: input });
    }),

  update: managerProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      sort: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "更新阶段");
      const { id, ...rest } = input;
      return ctx.db.followUpStage.update({ where: { id }, data: rest });
    }),

  delete: managerProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "删除阶段");
      return ctx.db.followUpStage.update({
        where: { id: input },
        data: { isActive: false },
      });
    }),
});
