import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "../trpc";
import { safeDbCall, assertDbAvailable } from "../lib/safeDb";
import { createLog, diffAndCreateLogs } from "../lib/logs";

const trackedFields = [
  "type", "title", "description", "duplicateReason",
  "responseNode", "status", "severity", "handlerId", "handleNote",
] as const;

export const abnormalRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      type: z.enum(["DUPLICATE_LEAD", "NO_RESPONSE", "OVERDUE", "COMPLAINT", "OTHER"]).optional(),
      status: z.string().optional(),
      severity: z.string().optional(),
      handlerId: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.type) where.type = input.type;
      if (input.status) where.status = input.status;
      if (input.severity) where.severity = input.severity;
      if (input.handlerId) where.handlerId = input.handlerId;
      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) where.createdAt.gte = input.dateFrom;
        if (input.dateTo) where.createdAt.lte = input.dateTo;
      }

      return safeDbCall(ctx, { total: 0, list: [] }, async () => {
        const [total, list] = await Promise.all([
          ctx.db.abnormalRecord.count({ where }),
          ctx.db.abnormalRecord.findMany({
            where,
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize,
            orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
            include: {
              lead: { include: { customer: true, stage: true } },
              customer: true,
              reporter: true,
              handler: true,
            },
          }),
        ]);
        return { total, list };
      }, "abnormal.list");
    }),

  detail: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return safeDbCall(ctx, null, async () => {
        const rec = await ctx.db.abnormalRecord.findUnique({
          where: { id: input },
          include: {
            lead: { include: { customer: true, stage: true } },
            customer: true,
            reporter: true,
            handler: true,
          },
        });
        if (!rec) return null;
        const logs = await ctx.db.operationLog.findMany({
          where: { entityType: "AbnormalRecord", entityId: input },
          orderBy: { createdAt: "desc" },
          include: { operator: true },
        });
        return { ...rec, logs };
      }, "abnormal.detail");
    }),

  create: protectedProcedure
    .input(z.object({
      type: z.enum(["DUPLICATE_LEAD", "NO_RESPONSE", "OVERDUE", "COMPLAINT", "OTHER"]).default("OTHER"),
      leadId: z.string().optional(),
      customerId: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      duplicateReason: z.string().optional(),
      responseNode: z.enum([
        "INITIAL_CONTACT", "FIRST_FOLLOWUP", "SECOND_FOLLOWUP",
        "APPOINTMENT_CONFIRM", "PRE_VISIT_REMINDER", "POST_VISIT_FOLLOWUP",
        "TREATMENT_FOLLOWUP", "PAYMENT_REMINDER",
      ]).optional(),
      severity: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "创建异常记录");
      const rec = await ctx.db.abnormalRecord.create({
        data: {
          ...input,
          reporterId: ctx.dbUser.id,
        },
      });

      if (input.leadId) {
        await ctx.db.lead.update({
          where: { id: input.leadId },
          data: { isAnomaly: true },
        });
      }

      await createLog(ctx.db, {
        entityType: "AbnormalRecord",
        entityId: rec.id,
        action: "CREATE",
        operatorId: ctx.dbUser.id,
        detail: `创建异常记录: ${input.title}`,
      });

      return rec;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      duplicateReason: z.string().optional(),
      responseNode: z.enum([
        "INITIAL_CONTACT", "FIRST_FOLLOWUP", "SECOND_FOLLOWUP",
        "APPOINTMENT_CONFIRM", "PRE_VISIT_REMINDER", "POST_VISIT_FOLLOWUP",
        "TREATMENT_FOLLOWUP", "PAYMENT_REMINDER",
      ]).optional(),
      status: z.string().optional(),
      severity: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "更新异常记录");
      const old = await ctx.db.abnormalRecord.findUnique({ where: { id: input.id } });
      if (!old) throw new Error("异常记录不存在");

      const { id, ...rest } = input;
      const updated = await ctx.db.abnormalRecord.update({
        where: { id },
        data: rest,
      });

      const logs = diffAndCreateLogs(
        "AbnormalRecord", id, old, rest, ctx.dbUser.id, trackedFields
      );
      for (const log of logs) await createLog(ctx.db, log);

      return updated;
    }),

  assignHandler: managerProcedure
    .input(z.object({
      id: z.string(),
      handlerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "指定异常责任人");
      const old = await ctx.db.abnormalRecord.findUnique({ where: { id: input.id } });
      const updated = await ctx.db.abnormalRecord.update({
        where: { id: input.id },
        data: { handlerId: input.handlerId, status: "PROCESSING" },
      });

      await createLog(ctx.db, {
        entityType: "AbnormalRecord",
        entityId: input.id,
        action: "UPDATE",
        fieldName: "handlerId",
        oldValue: old?.handlerId,
        newValue: input.handlerId,
        operatorId: ctx.dbUser.id,
        detail: "指定异常责任人",
      });

      return updated;
    }),

  handle: protectedProcedure
    .input(z.object({
      id: z.string(),
      handleNote: z.string(),
      resolved: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "处理异常记录");
      const old = await ctx.db.abnormalRecord.findUnique({
        where: { id: input.id },
        include: { lead: true },
      });
      if (!old) throw new Error("异常记录不存在");

      const updated = await ctx.db.abnormalRecord.update({
        where: { id: input.id },
        data: {
          handleNote: input.handleNote,
          status: input.resolved ? "RESOLVED" : "PROCESSING",
          handledAt: input.resolved ? new Date() : undefined,
          handlerId: old.handlerId ?? ctx.dbUser.id,
        },
      });

      if (input.resolved && old.lead) {
        await ctx.db.lead.update({
          where: { id: old.leadId! },
          data: { isAnomaly: false },
        });
      }

      await createLog(ctx.db, {
        entityType: "AbnormalRecord",
        entityId: input.id,
        action: "UPDATE",
        fieldName: input.resolved ? "status" : "handleNote",
        oldValue: old.status,
        newValue: input.resolved ? "RESOLVED" : "PROCESSING",
        operatorId: ctx.dbUser.id,
        detail: input.resolved ? "解决异常记录" : "处理异常记录",
      });

      return updated;
    }),

  markDuplicate: protectedProcedure
    .input(z.object({
      leadId: z.string(),
      duplicateLeadId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertDbAvailable(ctx, "标记线索撞单");
      await ctx.db.leadDuplicate.create({
        data: {
          leadId: input.leadId,
          duplicateLeadId: input.duplicateLeadId,
          reason: input.reason,
          detectedById: ctx.dbUser.id,
        },
      });

      const abnormal = await ctx.db.abnormalRecord.create({
        data: {
          type: "DUPLICATE_LEAD",
          leadId: input.leadId,
          title: "线索撞单",
          description: `与线索 ${input.duplicateLeadId} 撞单`,
          duplicateReason: input.reason,
          reporterId: ctx.dbUser.id,
          severity: "HIGH",
        },
      });

      await ctx.db.lead.update({
        where: { id: input.leadId },
        data: { isAnomaly: true },
      });

      return abnormal;
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    return safeDbCall(ctx, {
      total: 0,
      byType: {},
      byStatus: {},
      bySeverity: {},
      pending: 0,
      processing: 0,
      unresolved: 0,
      critical: 0,
    }, async () => {
      const all = await ctx.db.abnormalRecord.findMany();
      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};

      for (const r of all) {
        byType[r.type] = (byType[r.type] ?? 0) + 1;
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
        bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
      }

      const pending = all.filter((r) => r.status === "PENDING").length;
      const processing = all.filter((r) => r.status === "PROCESSING").length;
      const critical = all.filter((r) => r.severity === "CRITICAL" && r.status !== "RESOLVED").length;

      return {
        total: all.length,
        byType, byStatus, bySeverity,
        pending, processing,
        unresolved: all.length - (byStatus["RESOLVED"] ?? 0),
        critical,
      };
    }, "abnormal.stats");
  }),
});
