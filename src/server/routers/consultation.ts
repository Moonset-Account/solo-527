import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createLog, diffAndCreateLogs } from "../lib/logs";
import { Prisma } from "@prisma/client";

const trackedFields = [
  "chiefComplaint", "diagnosis", "treatmentPlan",
  "estimatedFee", "intentionLevel", "remark",
] as const;

export const consultationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      customerId: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      intentionLevel: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.customerId) where.customerId = input.customerId;
      if (input.dateFrom || input.dateTo) {
        where.consultationDate = {};
        if (input.dateFrom) where.consultationDate.gte = input.dateFrom;
        if (input.dateTo) where.consultationDate.lte = input.dateTo;
      }
      if (input.intentionLevel) where.intentionLevel = input.intentionLevel;

      const [total, list] = await Promise.all([
        ctx.db.consultationRecord.count({ where }),
        ctx.db.consultationRecord.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { consultationDate: "desc" },
          include: {
            customer: true,
            createdBy: true,
            leads: true,
          },
        }),
      ]);
      return { total, list };
    }),

  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      consultationDate: z.date().default(new Date()),
      chiefComplaint: z.string(),
      dentalHistory: z.string().optional(),
      diagnosis: z.string().optional(),
      treatmentPlan: z.string().optional(),
      estimatedFee: z.number().optional(),
      intentionLevel: z.string().optional(),
      intentionItems: z.record(z.unknown()).optional(),
      remark: z.string().optional(),
      createLead: z.boolean().default(true),
      leadTitle: z.string().optional(),
      leadQuality: z.enum(["HIGH", "MEDIUM", "LOW", "POTENTIAL"]).default("POTENTIAL"),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.$transaction(async (tx) => {
        const record = await tx.consultationRecord.create({
          data: {
            customerId: input.customerId,
            consultationDate: input.consultationDate,
            chiefComplaint: input.chiefComplaint,
            dentalHistory: input.dentalHistory,
            diagnosis: input.diagnosis,
            treatmentPlan: input.treatmentPlan,
            estimatedFee: input.estimatedFee ? new Prisma.Decimal(input.estimatedFee) : null,
            intentionLevel: input.intentionLevel,
            intentionItems: input.intentionItems as unknown as Prisma.InputJsonValue,
            remark: input.remark,
            createdById: ctx.dbUser.id,
          },
        });

        let lead = null;
        if (input.createLead) {
          lead = await tx.lead.create({
            data: {
              customerId: input.customerId,
              recordId: record.id,
              title: input.leadTitle || input.chiefComplaint.slice(0, 50),
              description: input.treatmentPlan,
              quality: input.leadQuality,
              estimatedAmount: input.estimatedFee ? new Prisma.Decimal(input.estimatedFee) : null,
              createdById: ctx.dbUser.id,
            },
          });
        }

        return { record, lead };
      });

      await createLog(ctx.db, {
        entityType: "ConsultationRecord",
        entityId: result.record.id,
        action: "CREATE",
        operatorId: ctx.dbUser.id,
        detail: "创建咨询记录",
      });

      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      chiefComplaint: z.string().optional(),
      dentalHistory: z.string().optional(),
      diagnosis: z.string().optional(),
      treatmentPlan: z.string().optional(),
      estimatedFee: z.number().optional(),
      intentionLevel: z.string().optional(),
      intentionItems: z.record(z.unknown()).optional(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const old = await ctx.db.consultationRecord.findUnique({ where: { id: input.id } });
      if (!old) throw new Error("记录不存在");

      const { id, ...rest } = input;
      const updateData: any = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value === undefined) continue;
        if (key === "estimatedFee" && typeof value === "number") {
          updateData[key] = new Prisma.Decimal(value);
        } else if (key === "intentionItems") {
          updateData[key] = value as unknown as Prisma.InputJsonValue;
        } else {
          updateData[key] = value;
        }
      }
      const updated = await ctx.db.consultationRecord.update({
        where: { id },
        data: updateData,
      });

      const logs = diffAndCreateLogs(
        "ConsultationRecord", id, old, updateData as any, ctx.dbUser.id, trackedFields
      );
      for (const log of logs) await createLog(ctx.db, log);

      return updated;
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayCount, weekCount, total, intentions] = await Promise.all([
      ctx.db.consultationRecord.count({
        where: { consultationDate: { gte: today } },
      }),
      ctx.db.consultationRecord.count({
        where: { consultationDate: { gte: weekAgo } },
      }),
      ctx.db.consultationRecord.count(),
      ctx.db.consultationRecord.groupBy({
        by: ["intentionLevel"],
        where: { intentionLevel: { not: null } },
        _count: true,
      }),
    ]);

    return { todayCount, weekCount, total, intentions };
  }),
});
