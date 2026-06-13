import { z } from "zod";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "../trpc";
import { createLog, diffAndCreateLogs } from "../lib/logs";
import { Prisma } from "@prisma/client";

const trackedFields = [
  "title", "description", "quality", "status",
  "estimatedAmount", "assignedToId", "stageId",
] as const;

export const leadRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      keyword: z.string().optional(),
      quality: z.enum(["HIGH", "MEDIUM", "LOW", "POTENTIAL"]).optional(),
      status: z.enum(["NEW", "CONTACTING", "APPOINTED", "VISITED", "TREATING", "CLOSED_WON", "CLOSED_LOST", "SUSPENDED"]).optional(),
      stageId: z.string().optional(),
      assignedToId: z.string().optional(),
      customerId: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      isAnomaly: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.keyword) {
        where.OR = [
          { title: { contains: input.keyword, mode: "insensitive" } },
          { customer: { name: { contains: input.keyword, mode: "insensitive" } } },
          { customer: { phone: { contains: input.keyword } } },
        ];
      }
      if (input.quality) where.quality = input.quality;
      if (input.status) where.status = input.status;
      if (input.stageId) where.stageId = input.stageId;
      if (input.assignedToId) where.assignedToId = input.assignedToId;
      if (input.customerId) where.customerId = input.customerId;
      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) where.createdAt.gte = input.dateFrom;
        if (input.dateTo) where.createdAt.lte = input.dateTo;
      }
      if (input.isAnomaly !== undefined) where.isAnomaly = input.isAnomaly;

      const [total, list] = await Promise.all([
        ctx.db.lead.count({ where }),
        ctx.db.lead.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            customer: true,
            stage: true,
            assignedTo: true,
            createdBy: true,
            record: true,
            followUpPlans: { orderBy: { planDate: "desc" }, take: 5 },
            payments: true,
          },
        }),
      ]);
      return { total, list };
    }),

  detail: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findUnique({
        where: { id: input },
        include: {
          customer: { include: { tags: { include: { tag: true } } } },
          stage: true,
          assignedTo: true,
          createdBy: true,
          record: true,
          followUpPlans: { orderBy: { planDate: "desc" } },
          payments: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!lead) return null;
      const logs = await ctx.db.operationLog.findMany({
        where: { entityType: "Lead", entityId: input },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { operator: true },
      });
      const plans = await ctx.db.followUpPlan.findMany({
        where: { leadId: input },
        orderBy: { planDate: "desc" },
        include: { createdBy: true },
      });
      const payments = await ctx.db.payment.findMany({
        where: { leadId: input },
        orderBy: { createdAt: "desc" },
      });
      return { ...lead, followUpPlans: plans, payments, logs };
    }),

  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      recordId: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      quality: z.enum(["HIGH", "MEDIUM", "LOW", "POTENTIAL"]).default("POTENTIAL"),
      estimatedAmount: z.number().optional(),
      assignedToId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const data: any = { ...input, createdById: ctx.dbUser.id };
      if (input.estimatedAmount !== undefined && input.estimatedAmount !== null) {
        data.estimatedAmount = new Prisma.Decimal(input.estimatedAmount);
      }
      const lead = await ctx.db.lead.create({ data });

      await createLog(ctx.db, {
        entityType: "Lead",
        entityId: lead.id,
        action: "CREATE",
        operatorId: ctx.dbUser.id,
        detail: `创建线索: ${lead.title}`,
      });

      return lead;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      quality: z.enum(["HIGH", "MEDIUM", "LOW", "POTENTIAL"]).optional(),
      status: z.enum(["NEW", "CONTACTING", "APPOINTED", "VISITED", "TREATING", "CLOSED_WON", "CLOSED_LOST", "SUSPENDED"]).optional(),
      estimatedAmount: z.number().optional(),
      assignedToId: z.string().optional(),
      stageId: z.string().optional(),
      isAnomaly: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const old = await ctx.db.lead.findUnique({ where: { id: input.id } });
      if (!old) throw new Error("线索不存在");

      const { id, ...rest } = input;
      const updateData: any = {};
      for (const [key, value] of Object.entries(rest)) {
        if (value === undefined) continue;
        if (key === "estimatedAmount" && typeof value === "number") {
          updateData[key] = new Prisma.Decimal(value);
        } else {
          updateData[key] = value;
        }
      }
      if (rest.status && old.status !== rest.status) {
        updateData.lastFollowAt = new Date();
        updateData.followUpCount = { increment: 1 };
      }

      const updated = await ctx.db.lead.update({
        where: { id },
        data: updateData,
      });

      const logs = diffAndCreateLogs(
        "Lead", id, old, updateData as any, ctx.dbUser.id, trackedFields
      );
      for (const log of logs) await createLog(ctx.db, log);

      return updated;
    }),

  assign: managerProcedure
    .input(z.object({
      id: z.string(),
      assignedToId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const old = await ctx.db.lead.findUnique({ where: { id: input.id } });
      const updated = await ctx.db.lead.update({
        where: { id: input.id },
        data: { assignedToId: input.assignedToId },
      });

      await createLog(ctx.db, {
        entityType: "Lead",
        entityId: input.id,
        action: "UPDATE",
        fieldName: "assignedToId",
        oldValue: old?.assignedToId,
        newValue: input.assignedToId,
        operatorId: ctx.dbUser.id,
        detail: "分配线索责任人",
      });

      return updated;
    }),

  export: protectedProcedure
    .input(z.object({
      quality: z.enum(["HIGH", "MEDIUM", "LOW", "POTENTIAL"]).optional(),
      status: z.enum(["NEW", "CONTACTING", "APPOINTED", "VISITED", "TREATING", "CLOSED_WON", "CLOSED_LOST", "SUSPENDED"]).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.quality) where.quality = input.quality;
      if (input.status) where.status = input.status;
      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) where.createdAt.gte = input.dateFrom;
        if (input.dateTo) where.createdAt.lte = input.dateTo;
      }

      const leads = await ctx.db.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          stage: true,
          assignedTo: true,
          payments: true,
        },
      });

      const headers = [
        "线索标题", "客户姓名", "联系电话", "质量等级", "状态", "阶段",
        "预估金额", "已回款", "责任人", "创建时间", "下次回访",
      ];

      const rows = leads.map((l) => [
        l.title,
        l.customer?.name ?? "",
        l.customer?.phone ?? "",
        qualityText(l.quality),
        statusText(l.status),
        l.stage?.name ?? "",
        String(l.estimatedAmount ?? 0),
        String(l.payments.reduce((s, p) => s + Number(p.paidAmount), 0)),
        l.assignedTo?.name ?? "",
        l.createdAt.toISOString().slice(0, 10),
        l.nextFollowAt?.toISOString().slice(0, 10) ?? "",
      ]);

      return {
        headers,
        rows,
        filename: `leads_${new Date().toISOString().slice(0, 10)}.csv`,
      };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.lead.findMany({
      include: { payments: true },
    });

    const byQuality = { HIGH: 0, MEDIUM: 0, LOW: 0, POTENTIAL: 0 };
    const byStatus: Record<string, number> = {};
    let totalEstimated = 0;
    let totalPaid = 0;

    for (const l of all) {
      byQuality[l.quality] = (byQuality[l.quality] ?? 0) + 1;
      byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
      totalEstimated += Number(l.estimatedAmount ?? 0);
      totalPaid += l.payments.reduce((s, p) => s + Number(p.paidAmount), 0);
    }

    return {
      total: all.length,
      byQuality,
      byStatus,
      totalEstimated,
      totalPaid,
      conversionRate: all.length ? (byStatus["CLOSED_WON"] ?? 0) / all.length : 0,
    };
  }),
});

function qualityText(q: string) {
  return { HIGH: "高意向", MEDIUM: "中意向", LOW: "低意向", POTENTIAL: "待评估" }[q] ?? q;
}
function statusText(s: string) {
  return {
    NEW: "新建", CONTACTING: "跟进中", APPOINTED: "已预约",
    VISITED: "已到店", TREATING: "治疗中", CLOSED_WON: "已成交",
    CLOSED_LOST: "已流失", SUSPENDED: "已暂缓",
  }[s] ?? s;
}
