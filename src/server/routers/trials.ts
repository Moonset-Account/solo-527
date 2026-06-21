import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db, sortBy } from "../db";
import { diffHours } from "@/lib/utils";
import type { Trial } from "@/types";

export const trialsRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1), pageSize: z.number().default(20),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
      followedUp: z.boolean().optional(),
    }))
    .query(({ ctx, input }) => {
      const campusId = ctx.campusId!;
      let items = db.trials.filter((t) => db.leads.findById(t.leadId)?.campusId === campusId);
      if (input.status) items = items.filter((t) => t.status === input.status);
      if (typeof input.followedUp === "boolean") items = items.filter((t) => t.followedUp === input.followedUp);
      items = sortBy(items, "trialAt", "desc");
      const start = (input.page - 1) * input.pageSize;
      return {
        total: items.length, page: input.page, pageSize: input.pageSize,
        items: items.slice(start, start + input.pageSize).map((t) => {
          const lead = db.leads.findById(t.leadId)!;
          const scheduled = db.staff.findById(t.scheduledById);
          const assignee = lead.assigneeId ? db.staff.findById(lead.assigneeId) : null;
          return { ...t, leadName: lead.name, phone: lead.phone, scheduledByName: scheduled?.name, assigneeName: assignee?.name, intendedMajor: lead.intendedMajor };
        }),
      };
    }),

  scheduleList: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const s = new Date(input.startDate); const e = new Date(input.endDate);
      return db.trials
        .filter((t) => {
          if (db.leads.findById(t.leadId)?.campusId !== campusId) return false;
          return t.trialAt >= s && t.trialAt <= e;
        })
        .map((t) => {
          const lead = db.leads.findById(t.leadId)!;
          return { ...t, leadName: lead.name, intendedMajor: lead.intendedMajor, level: lead.level };
        });
    }),

  create: protectedProcedure
    .input(z.object({
      leadId: z.string(), trialAt: z.string(), durationMinutes: z.number().min(30).default(90),
      className: z.string().optional(), teacherName: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const t = db.trials.create({
        leadId: input.leadId, scheduledById: ctx.staff!.id,
        trialAt: new Date(input.trialAt), durationMinutes: input.durationMinutes,
        className: input.className, teacherName: input.teacherName,
        status: "SCHEDULED", followedUp: false,
      });
      const lead = db.leads.findById(input.leadId);
      if (lead && lead.status !== "TRIAL_SCHEDULED" && lead.status !== "CONVERTED") {
        db.leads.update(input.leadId, { status: "TRIAL_SCHEDULED" });
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
    .mutation(({ ctx, input }) => {
      const patch: Partial<Trial> = { ...input.patch } as any;
      if (input.patch.trialAt) patch.trialAt = new Date(input.patch.trialAt);
      const updated = db.trials.update(input.id, patch);
      if (updated) db.log({ staffId: ctx.staff!.id, module: "TRIAL", action: "UPDATE", targetId: input.id });
      return updated;
    }),

  feedback: protectedProcedure
    .input(z.object({
      trialId: z.string(), satisfaction: z.number().min(1).max(5),
      parentFeedback: z.string().default(""), intentionLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
      teacherRemark: z.string().default(""),
    }))
    .mutation(({ ctx, input }) => {
      const t = db.trials.update(input.trialId, {
        satisfaction: input.satisfaction, parentFeedback: input.parentFeedback,
        intentionLevel: input.intentionLevel, teacherRemark: input.teacherRemark,
        status: "COMPLETED",
      });
      const lead = t ? db.leads.findById(t.leadId) : null;
      if (lead && (lead.status === "TRIAL_SCHEDULED")) {
        db.leads.update(lead.id, { status: "TRIAL_DONE" });
      }
      db.log({ staffId: ctx.staff!.id, module: "TRIAL", action: "FEEDBACK", targetId: input.trialId });
      return t;
    }),

  listUnfollowed: protectedProcedure.query(({ ctx }) => {
    const campusId = ctx.campusId!;
    const rules = db.settingRules.findOne((r) => r.campusId === campusId);
    const thresholdHours = rules?.trialFollowUpHours ?? 24;
    const now = new Date();
    return db.trials
      .filter((t) => {
        const lead = db.leads.findById(t.leadId);
        if (!lead || lead.campusId !== campusId) return false;
        if (t.status !== "COMPLETED" && t.status !== "NO_SHOW") return false;
        if (t.followedUp) return false;
        const elapsed = diffHours(t.trialAt, now);
        return elapsed >= thresholdHours || t.status === "NO_SHOW";
      })
      .map((t) => {
        const lead = db.leads.findById(t.leadId)!;
        return {
          id: t.id, leadName: lead.name, leadId: lead.id, phone: lead.phone,
          trialAt: t.trialAt, status: t.status, elapsedHours: diffHours(t.trialAt, now),
          assigneeId: lead.assigneeId, assigneeName: lead.assigneeId ? db.staff.findById(lead.assigneeId)?.name : "未分配",
        };
      });
  }),

  assignFollower: protectedProcedure
    .input(z.object({ trialId: z.string(), assigneeId: z.string() }))
    .mutation(({ ctx, input }) => {
      const t = db.trials.findById(input.trialId);
      if (!t) return null;
      const lead = db.leads.update(t.leadId, { assigneeId: input.assigneeId });
      db.log({ staffId: ctx.staff!.id, module: "TRIAL", action: "ASSIGN", targetId: input.trialId, afterData: { assigneeId: input.assigneeId } });
      return lead;
    }),
});
