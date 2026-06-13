import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "../trpc";
import { safeDbCall, assertDbAvailable } from "../lib/safeDb";
import { createLog } from "../lib/logs";
import { Prisma } from "@prisma/client";


export const followUpRouter = createTRPCRouter({
  rules: {
    list: protectedProcedure.query(async ({ ctx }) => {
      return safeDbCall(ctx, [], () =>
        ctx.db.followUpRule.findMany({
          where: { isActive: true },
          orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
          include: { triggerStage: true },
        }),
        "followUp.rules.list"
      );
    }),

    listAll: managerProcedure.query(async ({ ctx }) => {
      return safeDbCall(ctx, [], () =>
        ctx.db.followUpRule.findMany({
          orderBy: [{ isActive: "desc" }, { priority: "desc" }],
          include: { triggerStage: true },
        }),
        "followUp.rules.listAll"
      );
    }),

    create: managerProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        triggerStageId: z.string().optional(),
        triggerCondition: z.record(z.unknown()).optional(),
        method: z.enum(["PHONE", "WECHAT", "SMS", "EMAIL", "VISIT", "OTHER"]).default("PHONE"),
        intervalHours: z.number().default(24),
        templateContent: z.string().optional(),
        priority: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        assertDbAvailable(ctx, "创建回访规则");
        const data: any = { ...input };
        if (input.triggerCondition) {
          data.triggerCondition = input.triggerCondition as unknown as Prisma.InputJsonValue;
        }
        return ctx.db.followUpRule.create({ data });
      }),

    update: managerProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        triggerStageId: z.string().optional(),
        triggerCondition: z.record(z.unknown()).optional(),
        method: z.enum(["PHONE", "WECHAT", "SMS", "EMAIL", "VISIT", "OTHER"]).optional(),
        intervalHours: z.number().optional(),
        templateContent: z.string().optional(),
        isActive: z.boolean().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        assertDbAvailable(ctx, "更新回访规则");
        const { id, ...rest } = input;
        const data: any = {};
        for (const [key, value] of Object.entries(rest)) {
          if (value === undefined) continue;
          if (key === "triggerCondition") {
            data[key] = value as unknown as Prisma.InputJsonValue;
          } else {
            data[key] = value;
          }
        }
        return ctx.db.followUpRule.update({ where: { id }, data });
      }),

    delete: managerProcedure
      .input(z.string())
      .mutation(async ({ ctx, input }) => {
        assertDbAvailable(ctx, "删除回访规则");
        return ctx.db.followUpRule.update({
          where: { id: input },
          data: { isActive: false },
        });
      }),
  },

  plans: {
    list: protectedProcedure
      .input(z.object({
        leadId: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        isCompleted: z.boolean().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        const where: any = {};
        if (input.leadId) where.leadId = input.leadId;
        if (input.isCompleted !== undefined) where.isCompleted = input.isCompleted;
        if (input.dateFrom || input.dateTo) {
          where.planDate = {};
          if (input.dateFrom) where.planDate.gte = input.dateFrom;
          if (input.dateTo) where.planDate.lte = input.dateTo;
        }

        return safeDbCall(ctx, { total: 0, list: [] }, async () => {
          const [total, list] = await Promise.all([
            ctx.db.followUpPlan.count({ where }),
            ctx.db.followUpPlan.findMany({
              where,
              skip: (input.page - 1) * input.pageSize,
              take: input.pageSize,
              orderBy: [{ planDate: "asc" }],
              include: {
                lead: { include: { customer: true, stage: true } },
                createdBy: true,
              },
            }),
          ]);
          return { total, list };
        }, "followUp.plans.list");
      }),

    create: protectedProcedure
      .input(z.object({
        leadId: z.string(),
        planDate: z.date(),
        method: z.enum(["PHONE", "WECHAT", "SMS", "EMAIL", "VISIT", "OTHER"]).default("PHONE"),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        assertDbAvailable(ctx, "创建回访计划");
        const plan = await ctx.db.$transaction(async (tx) => {
          const p = await tx.followUpPlan.create({
            data: { ...input, createdById: ctx.dbUser.id },
          });
          await tx.lead.update({
            where: { id: input.leadId },
            data: {
              nextFollowAt: input.planDate,
              lastFollowAt: new Date(),
              followUpCount: { increment: 1 },
            },
          });
          return p;
        });

        await createLog(ctx.db, {
          entityType: "Lead",
          entityId: input.leadId,
          action: "UPDATE",
          fieldName: "followUpPlans",
          newValue: { planDate: input.planDate, method: input.method, content: input.content },
          operatorId: ctx.dbUser.id,
          detail: "创建回访计划",
        });

        return plan;
      }),

    complete: protectedProcedure
      .input(z.object({
        id: z.string(),
        result: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        assertDbAvailable(ctx, "完成回访计划");
        const plan = await ctx.db.followUpPlan.update({
          where: { id: input.id },
          data: {
            isCompleted: true,
            completedAt: new Date(),
            result: input.result,
          },
          include: { lead: true },
        });

        await createLog(ctx.db, {
          entityType: "Lead",
          entityId: plan.leadId,
          action: "UPDATE",
          fieldName: "followUpPlans",
          oldValue: { id: plan.id, isCompleted: false },
          newValue: { id: plan.id, isCompleted: true, result: input.result },
          operatorId: ctx.dbUser.id,
          detail: "完成回访计划",
        });

        return plan;
      }),

    upcoming: protectedProcedure.query(async ({ ctx }) => {
      const now = new Date();
      const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      return safeDbCall(ctx, [], () =>
        ctx.db.followUpPlan.findMany({
          where: {
            isCompleted: false,
            planDate: { lte: twoDaysLater },
            createdById: ctx.dbUser.id,
          },
          orderBy: { planDate: "asc" },
          take: 10,
          include: {
            lead: { include: { customer: true, stage: true } },
          },
        }),
        "followUp.plans.upcoming"
      );
    }),
  },
});
