import { z } from "zod";
import { protectedProcedure, router, requireRoles } from "../trpc";
import { db, sortBy } from "../db";
import { repose } from "../repositories";
import { diffHours, toDate } from "@/lib/utils";
import type { ExportTask } from "@/types";

export const reportsRouter = router({
  monthlyReport: protectedProcedure
    .use(requireRoles("PRINCIPAL", "FINANCE"))
    .input(z.object({ year: z.number().default(new Date().getFullYear()), month: z.number().default(new Date().getMonth() + 1) }))
    .query(async ({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const start = new Date(input.year, input.month - 1, 1);
      const end = new Date(input.year, input.month, 0, 23, 59, 59);
      const rangeFilter = (d: any) => {
        const dt = toDate(d);
        return dt >= start && dt <= end;
      };
      const allLeads = await repose.leads.list();
      const allTrials = await repose.trials.list();
      const allConsumptions = await repose.consumptions.list();
      const leadMap = new Map(allLeads.map((l: any) => [l.id, l]));

      const leads = allLeads.filter((l: any) => l.campusId === campusId && rangeFilter(l.createdAt));
      const trials = allTrials.filter((t: any) => {
        const l = leadMap.get(t.leadId);
        return l?.campusId === campusId && rangeFilter(t.trialAt);
      });
      const converted = leads.filter((l: any) => l.status === "CONVERTED").length;
      const consumptions = allConsumptions.filter((c: any) => rangeFilter(c.createdAt));
      const consHours = consumptions.reduce((s: number, c: any) => s + c.hours, 0);
      const trialCompleted = trials.filter((t: any) => t.status === "COMPLETED");
      const avgSatisfaction = trialCompleted.length > 0
        ? +(trialCompleted.reduce((s: number, t: any) => s + (t.satisfaction ?? 0), 0) / trialCompleted.length).toFixed(2)
        : 0;
      // chart data: daily consumption
      const dailyCons: { date: string; hours: number; classes: number }[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
        const day = consumptions.filter((c: any) => {
          const ca = toDate(c.createdAt);
          return ca >= dayStart && ca <= dayEnd;
        });
        const cls = new Set(day.map((c: any) => c.classId)).size;
        dailyCons.push({
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          hours: day.reduce((s: number, c: any) => s + c.hours, 0),
          classes: cls,
        });
      }
      // funnel: leads -> trial -> converted
      const funnel = [
        { name: "线索", value: leads.length, rate: 100 },
        { name: "排试听", value: trials.filter((t: any) => t.status !== "CANCELLED").length, rate: leads.length ? +(trials.length / leads.length * 100).toFixed(1) : 0 },
        { name: "完成试听", value: trialCompleted.length, rate: leads.length ? +(trialCompleted.length / leads.length * 100).toFixed(1) : 0 },
        { name: "转化签约", value: converted, rate: leads.length ? +(converted / leads.length * 100).toFixed(1) : 0 },
      ];
      return {
        period: `${input.year}年${input.month}月`,
        kpis: {
          leads: leads.length,
          trials: trials.length,
          trialAttendance: trials.length > 0 ? +(trialCompleted.length / trials.length * 100).toFixed(1) : 0,
          conversion: leads.length > 0 ? +(converted / leads.length * 100).toFixed(1) : 0,
          consumptionHours: consHours,
          avgSatisfaction,
        },
        dailyCons,
        funnel,
        byMajor: (["FINE_ARTS", "DESIGN", "MEDIA", "DANCE"] as const).map((m) => {
          const mLeads = leads.filter((l: any) => l.intendedMajor === m).length;
          const mCons = consumptions.filter((c: any) => {
            const cls = db.classes.findById(c.classId);
            return cls?.major === m;
          }).reduce((s: number, c: any) => s + c.hours, 0);
          return { major: m, leads: mLeads, consumptionHours: mCons };
        }),
      };
    }),

  renewalReport: protectedProcedure
    .use(requireRoles("PRINCIPAL"))
    .input(z.object({ riskLevel: z.enum(["ALL", "HIGH", "MID"]).default("ALL") }))
    .query(async ({ ctx, input }) => {
      const campusId = ctx.campusId!;
      const rules = db.settingRules.findOne((r: any) => r.campusId === campusId);
      const high = rules?.renewalHighRiskHours ?? 10;
      const mid = rules?.renewalMidRiskHours ?? 20;
      let students = db.students.filter((s: any) => s.campusId === campusId && s.status === "ACTIVE" && s.remainingHours <= mid);
      if (input.riskLevel === "HIGH") students = students.filter((s: any) => s.remainingHours <= high);
      const allFeedbacks = await repose.parentFeedbacks.list();
      const list = students.map((s: any) => {
        const level: "HIGH" | "MID" = s.remainingHours <= high ? "HIGH" : "MID";
        const classes = db.classes.filter((c: any) => c.studentIds.includes(s.id)).map((c: any) => c.name);
        const lastFeedback = sortBy(
          db.workFeedbacks.filter((f: any) => {
            const w = db.works.findById(f.workId);
            return w?.studentId === s.id;
          }), "createdAt", "desc",
        )[0];
        const totalCons = s.totalHours - s.remainingHours;
        const weeks = Math.max(1, Math.ceil((Date.now() - toDate(s.createdAt).getTime()) / (7 * 86400000)));
        const avg = totalCons / weeks;
        const daysLeft = avg > 0 ? Math.ceil(s.remainingHours / avg * 7) : 0;
        const recentUnread = allFeedbacks.find((f: any) => f.studentId === s.id && f.status === "UNREAD");
        const reasons: string[] = [];
        if (s.remainingHours <= high) reasons.push("剩余课时不足10节");
        else if (s.remainingHours <= mid) reasons.push("剩余课时不足20节");
        if (recentUnread) reasons.push("存在未读家长反馈");
        if (!lastFeedback) reasons.push("近期无作品评分记录");
        return {
          id: s.id, name: s.name, remainingHours: s.remainingHours, totalHours: s.totalHours,
          level, classes, lastFeedbackScore: (lastFeedback as any)?.overallScore, daysLeft,
          reasons, suggestions: level === "HIGH" ? ["本周内联系家长续报", "准备专属续费优惠方案"] : ["下节课后提醒家长", "推送孩子学习报告"],
        };
      });
      const stats = {
        total: list.length,
        high: list.filter((l) => l.level === "HIGH").length,
        mid: list.filter((l) => l.level === "MID").length,
      };
      return { list, stats, rules: { high, mid } };
    }),

  exportTaskList: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const all = await repose.exportTasks.list();
      const items = repose.exportTasks.sortBy(
        all.filter((t: any) => db.staff.findById(t.operatorId)?.campusId === ctx.campusId),
        "createdAt", "desc",
      );
      const p = repose.exportTasks.paginate(items, input.page, input.pageSize);
      return {
        ...p,
        items: p.items.map((t: any) => {
          const s = db.staff.findById(t.operatorId);
          return { ...t, operatorName: s?.name ?? "-", operatorRole: s?.role ?? "-" };
        }),
      };
    }),

  reDownload: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const t = await repose.exportTasks.update(input, { status: "DONE", doneAt: new Date() } as Partial<ExportTask>);
      if (t) db.log({ staffId: ctx.staff!.id, module: "EXPORT", action: "RE_DOWNLOAD", targetId: input });
      return t;
    }),

  createExport: protectedProcedure
    .input(z.object({ module: z.string(), fileName: z.string(), format: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await repose.exportTasks.create({
        operatorId: ctx.staff!.id, module: input.module, fileName: input.fileName,
        format: input.format, status: "DONE", downloadUrl: "#", doneAt: new Date(),
      });
      db.log({ staffId: ctx.staff!.id, module: "EXPORT", action: "CREATE", afterData: { fileName: input.fileName, module: input.module } });
      return task;
    }),
});
