import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db } from "../db";
import { repose } from "../repositories";
import { diffHours, toDate } from "@/lib/utils";
import type { Trial } from "@/types";

export const trialsRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1), pageSize: z.number().default(20),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
      followedUp: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const allTrials = await repose.trials.list();
      const allLeads = await repose.leads.list();
      const leadMap = new Map(allLeads.map((l: any) => [l.id, l]));
      let items = allTrials.filter((t: any) => {
        const lead = leadMap.get(t.leadId);
        return lead?.campusId === campusId;
      });
      if (input.status) items = items.filter((t: any) => t.status === input.status);
      if (typeof input.followedUp === "boolean") items = items.filter((t: any) => t.followedUp === input.followedUp);
      items = repose.trials.sortBy(items, "trialAt", "desc");
      const { items: pageItems, total, page, pageSize } = repose.trials.paginate(items, input.page, input.pageSize);
      const hydrated = pageItems.map((t: any) => {
        const lead = leadMap.get(t.leadId)!;
        const scheduled = db.staff.findById(t.scheduledById);
        const assignee = lead.assigneeId ? db.staff.findById(lead.assigneeId) : null;
        return { ...t, leadName: lead.name, phone: lead.phone, scheduledByName: scheduled?.name, assigneeName: assignee?.name, intendedMajor: lead.intendedMajor };
      });
      return { total, page, pageSize, items: hydrated };
    }),

  scheduleList: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const s = new Date(input.startDate); const e = new Date(input.endDate);
      const allTrials = await repose.trials.list();
      const allLeads = await repose.leads.list();
      const leadMap = new Map(allLeads.map((l: any) => [l.id, l]));
      return allTrials
        .filter((t: any) => {
          const lead = leadMap.get(t.leadId);
          if (lead?.campusId !== campusId) return false;
          const ta = toDate(t.trialAt);
          return ta >= s && ta <= e;
        })
        .map((t: any) => {
          const lead = leadMap.get(t.leadId)!;
          return { ...t, leadName: lead.name, intendedMajor: lead.intendedMajor, level: lead.level };
        });
    }),

  create: protectedProcedure
    .input(z.object({
      leadId: z.string(), trialAt: z.string(), durationMinutes: z.number().min(30).default(90),
      className: z.string().optional(), teacherName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const t = await repose.trials.create({
        leadId: input.leadId, scheduledById: ctx.staff!.id,
        trialAt: new Date(input.trialAt), durationMinutes: input.durationMinutes,
        className: input.className, teacherName: input.teacherName,
        status: "SCHEDULED", followedUp: false,
      });
      const lead = await repose.leads.findById(input.leadId);
      if (lead && lead.status !== "TRIAL_SCHEDULED" && lead.status !== "CONVERTED") {
        await repose.leads.update(input.leadId, { status: "TRIAL_SCHEDULED" } as any);
      }
      db.log({ staffId: ctx.staff!.id, module: "TRIAL", action: "CREATE", targetId: t.id, afterData: { trialAt: input.trialAt, leadId: input.leadId } });
      return t;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), patch: z.object({
      trialAt: z.string().optional(), durationMinutes: z.number().optional(),
      className: z.string().optional(), teacherName: z.string().optional(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
      followedUp: z.boolean().optional(),
    }) }))
    .mutation(async ({ ctx, input }) => {
      const patch: Partial<Trial> = { ...input.patch } as any;
      if (input.patch.trialAt) patch.trialAt = new Date(input.patch.trialAt);
      const updated = await repose.trials.update(input.id, patch);
      if (updated) db.log({ staffId: ctx.staff!.id, module: "TRIAL", action: "UPDATE", targetId: input.id });
      return updated;
    }),

  feedback: protectedProcedure
    .input(z.object({
      trialId: z.string(), satisfaction: z.number().min(1).max(5),
      parentFeedback: z.string().default(""), intentionLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
      teacherRemark: z.string().default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      const t = await repose.trials.update(input.trialId, {
        satisfaction: input.satisfaction, parentFeedback: input.parentFeedback,
        intentionLevel: input.intentionLevel, teacherRemark: input.teacherRemark,
        status: "COMPLETED",
      });
      const lead = t ? await repose.leads.findById(t.leadId) : null;
      if (lead && lead.status === "TRIAL_SCHEDULED") {
        await repose.leads.update(lead.id, { status: "TRIAL_DONE" } as any);
      }
      db.log({ staffId: ctx.staff!.id, module: "TRIAL", action: "FEEDBACK", targetId: input.trialId });
      return t;
    }),

  listUnfollowed: protectedProcedure.query(async ({ ctx }) => {
    const campusId = ctx.campusId!;
    const rules = db.settingRules.findOne((r: any) => r.campusId === campusId);
    const thresholdHours = rules?.trialFollowUpHours ?? 24;
    const now = new Date();
    const allTrials = await repose.trials.list();
    const allLeads = await repose.leads.list();
    const leadMap = new Map(allLeads.map((l: any) => [l.id, l]));
    return allTrials
      .filter((t: any) => {
        const lead = leadMap.get(t.leadId);
        if (!lead || lead.campusId !== campusId) return false;
        if (t.status !== "COMPLETED" && t.status !== "NO_SHOW") return false;
        if (t.followedUp) return false;
        const elapsed = diffHours(t.trialAt, now);
        return elapsed >= thresholdHours || t.status === "NO_SHOW";
      })
      .map((t: any) => {
        const lead = leadMap.get(t.leadId)!;
        return {
          id: t.id, leadName: lead.name, leadId: lead.id, phone: lead.phone,
          trialAt: t.trialAt, status: t.status, elapsedHours: diffHours(t.trialAt, now),
          assigneeId: lead.assigneeId, assigneeName: lead.assigneeId ? db.staff.findById(lead.assigneeId)?.name : "未分配",
        };
      });
  }),

  assignFollower: protectedProcedure
    .input(z.object({ trialId: z.string(), assigneeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const t = await repose.trials.findById(input.trialId);
      if (!t) return null;
      const lead = await repose.leads.update(t.leadId, { assigneeId: input.assigneeId } as any);
      db.log({ staffId: ctx.staff!.id, module: "TRIAL", action: "ASSIGN", targetId: input.trialId, afterData: { assigneeId: input.assigneeId } });
      return lead;
    }),
});
