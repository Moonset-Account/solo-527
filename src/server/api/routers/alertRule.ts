import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";

export const alertRuleRouter = router({
  list: publicProcedure
    .input(z.object({ isEnabled: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const rules = await db.alertRule.findMany({
        where: input?.isEnabled !== undefined ? { isEnabled: input.isEnabled } : undefined,
        include: {
          metric: true,
          createdBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return rules;
    }),

  getById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const rule = await db.alertRule.findUnique({
        where: { id: input },
        include: {
          metric: true,
          createdBy: { select: { name: true, email: true } },
          _count: { select: { anomalies: true } },
        },
      });
      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND", message: "告警规则不存在" });
      }
      return rule;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        metricId: z.string(),
        period: z.enum(["DAY", "WEEK", "MONTH"]),
        thresholdType: z.enum(["ABSOLUTE", "PERCENTAGE"]),
        thresholdValue: z.number(),
        direction: z.enum(["ABOVE", "BELOW", "BOTH"]),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        channels: z.array(
          z.object({
            type: z.enum(["in_app", "email", "wework"]),
            recipients: z.array(z.string()),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const rule = await db.alertRule.create({
        data: {
          ...input,
          createdById: ctx.userId,
          channels: input.channels as any,
        },
        include: { metric: true },
      });
      return rule;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        period: z.enum(["DAY", "WEEK", "MONTH"]).optional(),
        thresholdType: z.enum(["ABSOLUTE", "PERCENTAGE"]).optional(),
        thresholdValue: z.number().optional(),
        direction: z.enum(["ABOVE", "BELOW", "BOTH"]).optional(),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        channels: z
          .array(
            z.object({
              type: z.enum(["in_app", "email", "wework"]),
              recipients: z.array(z.string()),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, channels, ...data } = input;
      const rule = await db.alertRule.update({
        where: { id },
        data: {
          ...data,
          ...(channels ? { channels: channels as any } : {}),
        },
        include: { metric: true },
      });
      return rule;
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string(), isEnabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const rule = await db.alertRule.update({
        where: { id: input.id },
        data: { isEnabled: input.isEnabled },
      });
      return rule;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      await db.alertRule.delete({ where: { id: input } });
      return { success: true };
    }),
});
