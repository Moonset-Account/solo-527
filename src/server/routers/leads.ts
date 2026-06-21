import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db, paginate, sortBy } from "../db";
import type { Lead } from "@/types";

const LeadLevel = z.enum(["HOT", "WARM", "COLD"]);
const LeadStatus = z.enum(["NEW", "FOLLOWING", "TRIAL_SCHEDULED", "TRIAL_DONE", "CONVERTED", "LOST", "ARCHIVED"]);
const Major = z.enum(["FINE_ARTS", "DESIGN", "MEDIA", "MUSIC", "DANCE", "OTHER"]);

export const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(5).max(100).default(10),
      source: z.string().optional(),
      intendedMajor: Major.optional(),
      assigneeId: z.string().optional(),
      status: LeadStatus.optional(),
      level: LeadLevel.optional(),
      keyword: z.string().optional(),
      sortByKey: z.string().default("createdAt"),
      sortDir: z.enum(["asc", "desc"]).default("desc"),
    }))
    .query(({ ctx, input }) => {
      const campusId = ctx.campusId!;
      let items = db.leads.filter((l) => l.campusId === campusId);
      if (input.source) items = items.filter((l) => l.source === input.source);
      if (input.intendedMajor) items = items.filter((l) => l.intendedMajor === input.intendedMajor);
      if (input.assigneeId) items = items.filter((l) => l.assigneeId === input.assigneeId);
      if (input.status) items = items.filter((l) => l.status === input.status);
      if (input.level) items = items.filter((l) => l.level === input.level);
      if (input.keyword) {
        const kw = input.keyword.toLowerCase();
        items = items.filter((l) => l.name.toLowerCase().includes(kw) || l.phone.includes(kw));
      }
      items = sortBy(items, input.sortByKey as keyof Lead, input.sortDir);
      const { items: pageItems, total, page, pageSize, totalPages } = paginate(items, input.page, input.pageSize);
      const hydrated = pageItems.map((l) => {
        const assignee = l.assigneeId ? db.staff.findById(l.assigneeId) : null;
        const followUpCount = db.followUps.count((f) => f.leadId === l.id);
        const trials = db.trials.filter((t) => t.leadId === l.id);
        return { ...l, assigneeName: assignee?.name ?? "未分配", followUpCount, trialCount: trials.length };
      });
      return { items: hydrated, total, page, pageSize, totalPages };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(({ input }) => {
      const lead = db.leads.findById(input);
      if (!lead) return null;
      const assignee = lead.assigneeId ? db.staff.findById(lead.assigneeId) : null;
      const followUps = sortBy(db.followUps.filter((f) => f.leadId === lead.id), "createdAt", "desc").map((f) => {
        const st = db.staff.findById(f.staffId);
        return { ...f, staffName: st?.name ?? "未知" };
      });
      const trials = sortBy(db.trials.filter((t) => t.leadId === lead.id), "trialAt", "desc").map((t) => {
        const sc = t.scheduledById ? db.staff.findById(t.scheduledById) : null;
        return { ...t, scheduledByName: sc?.name ?? "-" };
      });
      const convertedStudent = lead.id ? db.students.findOne((s) => s.leadId === lead.id) : null;
      return { ...lead, assigneeName: assignee?.name, assigneeAvatar: assignee?.avatarUrl, followUps, trials, convertedStudent };
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1), phone: z.string().min(6),
      parentName: z.string().optional(), source: z.string().optional(),
      intendedMajor: Major.optional(), level: LeadLevel.default("WARM"),
      tags: z.array(z.string()).default([]), remark: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const lead = db.leads.create({
        campusId: ctx.campusId!, ...input, status: "NEW",
      });
      db.log({ staffId: ctx.staff!.id, module: "LEAD", action: "CREATE", targetId: lead.id, afterData: { name: input.name, source: input.source } });
      return lead;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), patch: z.object({
      name: z.string().optional(), phone: z.string().optional(), parentName: z.string().optional(),
      source: z.string().optional(), intendedMajor: Major.optional(), level: LeadLevel.optional(),
      status: LeadStatus.optional(), tags: z.array(z.string()).optional(), remark: z.string().optional(),
    }) }))
    .mutation(({ ctx, input }) => {
      const before = db.leads.findById(input.id);
      const updated = db.leads.update(input.id, input.patch as Partial<Lead>);
      if (updated) {
        db.log({ staffId: ctx.staff!.id, module: "LEAD", action: "UPDATE", targetId: input.id, beforeData: before, afterData: updated });
      }
      return updated;
    }),

  addFollowUp: protectedProcedure
    .input(z.object({
      leadId: z.string(), type: z.enum(["PHONE", "WECHAT", "VISIT", "OTHER"]),
      content: z.string().min(1), nextFollowAt: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const fu = db.followUps.create({
        leadId: input.leadId, staffId: ctx.staff!.id,
        type: input.type, content: input.content,
        nextFollowAt: input.nextFollowAt ? new Date(input.nextFollowAt) : undefined,
      });
      // auto bump status
      const lead = db.leads.findById(input.leadId);
      if (lead && lead.status === "NEW") {
        db.leads.update(input.leadId, { status: "FOLLOWING" });
      }
      db.log({ staffId: ctx.staff!.id, module: "LEAD", action: "ADD_FOLLOWUP", targetId: input.leadId, afterData: { type: input.type, length: input.content.length } });
      return fu;
    }),

  assign: protectedProcedure
    .input(z.object({ leadIds: z.array(z.string().min(1)), assigneeId: z.string() }))
    .mutation(({ ctx, input }) => {
      const updated: string[] = [];
      input.leadIds.forEach((id) => {
        const r = db.leads.update(id, { assigneeId: input.assigneeId });
        if (r) updated.push(id);
      });
      db.log({ staffId: ctx.staff!.id, module: "LEAD", action: "ASSIGN", afterData: { count: updated.length, assigneeId: input.assigneeId } });
      return { updated };
    }),

  batchUpdate: protectedProcedure
    .input(z.object({ ids: z.array(z.string()), patch: z.object({ status: LeadStatus.optional(), level: LeadLevel.optional() }) }))
    .mutation(({ ctx, input }) => {
      input.ids.forEach((id) => db.leads.update(id, input.patch as Partial<Lead>));
      db.log({ staffId: ctx.staff!.id, module: "LEAD", action: "BATCH_UPDATE", afterData: { ids: input.ids, patch: input.patch } });
      return { updated: input.ids.length };
    }),

  export: protectedProcedure
    .input(z.object({ filters: z.object({}).passthrough().optional(), format: z.enum(["XLSX", "CSV"]).default("XLSX") }))
    .mutation(({ ctx, input }) => {
      const stamp = new Date();
      const fname = `线索列表_${stamp.getFullYear()}${(stamp.getMonth() + 1).toString().padStart(2, "0")}${stamp.getDate().toString().padStart(2, "0")}.${input.format.toLowerCase()}`;
      const task = db.exportTasks.create({
        operatorId: ctx.staff!.id, fileName: fname, module: "LEAD", filters: input.filters ?? {},
        format: input.format, status: "DONE", downloadUrl: "#", doneAt: new Date(),
      });
      db.log({ staffId: ctx.staff!.id, module: "EXPORT", action: "LEAD", afterData: { fileName: fname, format: input.format } });
      return task;
    }),

  meta: protectedProcedure.query(({ ctx }) => {
    const campusId = ctx.campusId!;
    const leads = db.leads.filter((l) => l.campusId === campusId);
    return {
      sources: Array.from(new Set(leads.map((l) => l.source).filter(Boolean))) as string[],
      assignees: db.staff.filter((s) => s.campusId === campusId && s.status === "ACTIVE" && (s.role === "ACADEMIC_AFFAIRS" || s.role === "PRINCIPAL")).map((s) => ({ id: s.id, name: s.name, role: s.role })),
      counts: {
        NEW: leads.filter((l) => l.status === "NEW").length,
        FOLLOWING: leads.filter((l) => l.status === "FOLLOWING").length,
        TRIAL_SCHEDULED: leads.filter((l) => l.status === "TRIAL_SCHEDULED").length,
        TRIAL_DONE: leads.filter((l) => l.status === "TRIAL_DONE").length,
        CONVERTED: leads.filter((l) => l.status === "CONVERTED").length,
        LOST: leads.filter((l) => l.status === "LOST").length,
      },
    };
  }),
});
