import { z } from "zod";
import { protectedProcedure, router, requireRoles } from "../trpc";
import { db } from "../db";
import { diffHours, toDate } from "@/lib/utils";

export const dashboardRouter = router({
  getKPIs: protectedProcedure
    .input(z.object({ range: z.enum(["TODAY", "WEEK", "MONTH", "QUARTER"]).default("MONTH") }))
    .query(async ({ ctx }) => {
      const campusId = ctx.campusId!;
      const totalLeads = db.leads.count((l) => l.campusId === campusId);
      const totalTrials = db.trials.count((t) => {
        const lead = db.leads.findById(t.leadId);
        return lead?.campusId === campusId && t.status !== "CANCELLED";
      });
      const converted = db.leads.count((l) => l.campusId === campusId && l.status === "CONVERTED");
      const totalConsumptions = db.consumptions
        .filter((c) => c.classId && db.classes.findById(c.classId)?.campusId === campusId)
        .reduce((s, c) => s + c.hours, 0);
      const totalStudents = db.students.count((s) => s.campusId === campusId && s.status === "ACTIVE");
      const renewalRiskCount = db.students.filter((s) => s.campusId === campusId && s.status === "ACTIVE" && s.remainingHours <= 20).length;
      const unfollowedTrialCount = db.trials.filter((t) => {
        const lead = db.leads.findById(t.leadId);
        return lead?.campusId === campusId && t.status === "COMPLETED" && !t.followedUp;
      }).length;
      const conversionRate = totalLeads > 0 ? +(converted / totalLeads * 100).toFixed(1) : 0;
      return {
        leads: { value: totalLeads, delta: +12.3, label: "本月线索数" },
        trials: { value: totalTrials, delta: +8.7, label: "本月试听课" },
        conversionRate: { value: conversionRate, delta: +2.1, label: "线索转化率 %" },
        consumptionHours: { value: totalConsumptions, delta: +15.6, label: "本月消课时" },
        students: { value: totalStudents, delta: +5.2, label: "在籍学员数" },
        renewalRisk: { value: renewalRiskCount, delta: -3, label: "续费风险学员" },
        unfollowedTrials: { value: unfollowedTrialCount, delta: +1, label: "试听未跟进数" },
      };
    }),

  getRenewalRisks: protectedProcedure
    .input(z.object({ limit: z.number().min(5).max(50).default(10) }))
    .query(({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const rules = db.settingRules.findOne((r) => r.campusId === campusId);
      const high = rules?.renewalHighRiskHours ?? 10;
      const mid = rules?.renewalMidRiskHours ?? 20;
      const students = db.students
        .filter((s) => s.campusId === campusId && s.status === "ACTIVE" && s.remainingHours <= mid)
        .slice(0, input.limit);
      return students.map((s) => {
        const level: "HIGH" | "MID" | "LOW" = s.remainingHours <= high ? "HIGH" : "MID";
        const enrolls = db.classes.filter((c) => c.studentIds.includes(s.id));
        const lastRenewal = toDate(s.createdAt);
        const totalConsumed = s.totalHours - s.remainingHours;
        const avgPerWeek = totalConsumed / Math.max(1, Math.ceil((Date.now() - lastRenewal.getTime()) / (7 * 86400000)));
        const expectedDaysLeft = avgPerWeek > 0 ? Math.ceil(s.remainingHours / avgPerWeek * 7) : 0;
        return {
          id: s.id, name: s.name, remainingHours: s.remainingHours, totalHours: s.totalHours,
          level, classes: enrolls.map((c) => c.name),
          expectedDaysLeft,
          lastFollowUp: null,
        };
      });
    }),

  getUnfollowedTrials: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const rules = db.settingRules.findOne((r) => r.campusId === campusId);
      const thresholdHours = rules?.trialFollowUpHours ?? 24;
      const now = new Date();
      return db.trials
        .filter((t) => {
          const lead = db.leads.findById(t.leadId);
          if (!lead || lead.campusId !== campusId) return false;
          if (t.status !== "COMPLETED" && t.status !== "NO_SHOW") return false;
          if (!!t.followedUp) return false;
          const elapsed = diffHours(t.trialAt, now);
          return elapsed >= thresholdHours || t.status === "NO_SHOW";
        })
        .slice(0, input.limit)
        .map((t) => {
          const lead = db.leads.findById(t.leadId)!;
          const assignee = lead.assigneeId ? db.staff.findById(lead.assigneeId) : null;
          const elapsed = diffHours(t.trialAt, now);
          return {
            id: t.id, leadId: lead.id, leadName: lead.name, phone: lead.phone,
            trialAt: t.trialAt, elapsedHours: elapsed, status: t.status,
            assigneeName: assignee?.name ?? "未分配", assigneeId: assignee?.id,
            thresholdHours, isOverdue: elapsed >= thresholdHours,
          };
        });
    }),

  getTodayTodos: protectedProcedure.query(({ ctx }) => {
    const campusId = ctx.campusId!;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
    const followDueToday = db.followUps
      .filter((f) => f.nextFollowAt && toDate(f.nextFollowAt) >= today && toDate(f.nextFollowAt) < tmr)
      .map((f) => {
        const lead = db.leads.findById(f.leadId)!;
        return { type: "FOLLOW_UP" as const, id: f.id, title: `跟进 · ${lead.name}`, desc: f.content.slice(0, 30), href: `/leads/${lead.id}` };
      });
    const trialsToday = db.trials
      .filter((t) => toDate(t.trialAt) >= today && toDate(t.trialAt) < tmr && t.status === "SCHEDULED")
      .map((t) => {
        const lead = db.leads.findById(t.leadId)!;
        return { type: "TRIAL" as const, id: t.id, title: `试听 · ${lead.name}`, desc: `${t.className ?? "体验课"} · ${toDate(t.trialAt).toTimeString().slice(0, 5)}`, href: `/trials/schedule` };
      });
    const lessonsToday = db.lessons
      .filter((l) => toDate(l.startAt) >= today && toDate(l.startAt) < tmr && (l.status === "PLANNED" || l.status === "IN_PROGRESS"))
      .map((l) => {
        const cls = db.classes.findById(l.classId)!;
        return { type: "LESSON" as const, id: l.id, title: `上课 · ${cls.name}`, desc: `${l.title} · ${toDate(l.startAt).toTimeString().slice(0, 5)} · ${l.room ?? ""}`, href: `/classes/${cls.id}` };
      });
    const unreadFeedback = db.parentFeedbacks
      .filter((f) => f.status === "UNREAD")
      .slice(0, 5)
      .map((f) => {
        const s = db.students.findById(f.studentId)!;
        return { type: "FEEDBACK" as const, id: f.id, title: `家校反馈 · ${s.name}家长`, desc: f.title, href: "/feedback" };
      });
    return [...followDueToday, ...trialsToday, ...lessonsToday, ...unreadFeedback].slice(0, 20);
  }),

  // Role guard example: principal only report summary
  getPrincipalReport: protectedProcedure.use(requireRoles("PRINCIPAL", "FINANCE"))
    .query(() => {
      const consumptions = db.consumptions.list();
      const totalHours = consumptions.reduce((s, c) => s + c.hours, 0);
      const exceptionCount = consumptions.filter((c) => c.status === "EXCEPTION").length;
      return { totalHours, exceptionCount, totalRevenue: totalHours * 260, reconciliationRate: consumptions.length === 0 ? 100 : (consumptions.filter((c) => c.status !== "EXCEPTION").length / consumptions.length * 100) };
    }),
});
