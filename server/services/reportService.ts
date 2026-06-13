import { ConsumptionRecordModel as CRM } from "@/server/models/ConsumptionRecord";
import { FeedbackModel as FM } from "@/server/models/Feedback";
import { demoStore } from "@/server/db/demoData";
import { queryAuditLogsByTarget } from "./auditService";
import type {
  ConsumptionRecord,
  DailyReportItem,
  Feedback,
  MonthlyReport,
  ReportQuery,
} from "@/shared/types";
import { formatDate } from "@/shared/utils";

const ConsumptionRecordModel: any = CRM;
const FeedbackModel: any = FM;

function inDateRange(createdAt: string, start: string, end: string) {
  const d = (createdAt || "").slice(0, 10);
  return d >= start && d <= end;
}

export async function queryConsumptionRecords(query: ReportQuery) {
  const { startDate, endDate, classId, studentId } = query;
  let docs: any[] = [];
  try {
    const filter: any = {
      createdAt: { $gte: `${startDate} 00:00:00`, $lte: `${endDate} 23:59:59` },
    };
    if (classId) filter.classId = classId;
    if (studentId) filter.studentId = studentId;
    docs = await ConsumptionRecordModel.find(filter).sort({ createdAt: -1 }).lean();
  } catch {}
  if (docs.length === 0) {
    docs = demoStore
      .all("consumptionRecords")
      .filter((d) => inDateRange(d.createdAt, startDate, endDate))
      .filter((d) => !classId || d.classId === classId)
      .filter((d) => !studentId || d.studentId === studentId)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  const ids = docs.map((d) => d._id?.toString() || d.id);

  let feedbacks: any[] = [];
  try {
    feedbacks = await FeedbackModel.find({ consumptionId: { $in: ids } }).lean();
  } catch {}
  if (feedbacks.length === 0) {
    feedbacks = demoStore.find("feedbacks", { consumptionId: { $in: ids } as any });
    if (feedbacks.length === 0) {
      feedbacks = demoStore.all("feedbacks").filter((f) => ids.includes(f.consumptionId));
    }
  }
  const auditLogsMap = await Promise.all(
    ids.map(async (id) => ({ id, logs: await queryAuditLogsByTarget("consumption", id, 5) }))
  );

  const feedbackMap = new Map(feedbacks.map((f) => [f.consumptionId, f]));
  const auditMap = new Map(auditLogsMap.map((a) => [a.id, a.logs]));

  return docs.map((d) => {
    const id = d._id?.toString() || d.id;
    const fb = feedbackMap.get(id) as any;
    const demoRecord = demoStore.findById("consumptionRecords", id);
    return {
      ...d,
      id,
      auditLogs: auditMap.get(id) || demoRecord?.auditLogs || [],
      feedback: fb
        ? ({ ...fb, id: fb._id?.toString() || fb.id } as Feedback)
        : (demoRecord?.feedback as Feedback | undefined),
    } as ConsumptionRecord;
  });
}

export async function getDailySeries(query: ReportQuery): Promise<DailyReportItem[]> {
  const { startDate, endDate, classId, studentId } = query;
  try {
    const docs = await ConsumptionRecordModel.aggregate([
      {
        $match: {
          createdAt: { $gte: `${startDate} 00:00:00`, $lte: `${endDate} 23:59:59` },
          ...(classId ? { classId } : {}),
          ...(studentId ? { studentId } : {}),
        },
      },
      {
        $group: {
          _id: { $substr: ["$createdAt", 0, 10] },
          totalHours: { $sum: "$hours" },
          studentCount: { $addToSet: "$studentId" },
          abnormalCount: { $sum: { $cond: ["$isInsufficient", 1, 0] } },
          totalRecords: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    if (docs && docs.length > 0) {
      return docs.map((d) => ({
        date: d._id,
        totalHours: d.totalHours,
        studentCount: Array.isArray(d.studentCount) ? d.studentCount.length : 0,
        abnormalCount: d.abnormalCount,
        totalRecords: d.totalRecords,
      }));
    }
  } catch {}

  const records = demoStore
    .all("consumptionRecords")
    .filter((d) => inDateRange(d.createdAt, startDate, endDate))
    .filter((d) => !classId || d.classId === classId)
    .filter((d) => !studentId || d.studentId === studentId);

  const byDate = new Map<string, { totalHours: number; students: Set<string>; abnormalCount: number; totalRecords: number }>();
  for (const r of records) {
    const d = (r.createdAt || "").slice(0, 10);
    if (!d) continue;
    const cur = byDate.get(d) || { totalHours: 0, students: new Set(), abnormalCount: 0, totalRecords: 0 };
    cur.totalHours += r.hours || 0;
    cur.students.add(r.studentId);
    if (r.isInsufficient) cur.abnormalCount++;
    cur.totalRecords++;
    byDate.set(d, cur);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      totalHours: v.totalHours,
      studentCount: v.students.size,
      abnormalCount: v.abnormalCount,
      totalRecords: v.totalRecords,
    }));
}

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  const { start, end } = (await import("@/shared/utils")).getMonthRange(year, month);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const lastYear = month === 0 ? year - 1 : year;
  const lastMonth = month === 0 ? 11 : month - 1;
  const { start: lastStart, end: lastEnd } = (await import("@/shared/utils")).getMonthRange(lastYear, lastMonth);
  const lastStartStr = formatDate(lastStart);
  const lastEndStr = formatDate(lastEnd);

  let current: any[] = [];
  let lastMonthData: any[] = [];
  let topList: any[] = [];
  let abnormalList: any[] = [];
  let feedbackCount = 0;

  try {
    [current, lastMonthData, topList, abnormalList, feedbackCount] = await Promise.all([
      ConsumptionRecordModel.aggregate([
        { $match: { createdAt: { $gte: `${startStr} 00:00:00`, $lte: `${endStr} 23:59:59` } } },
        { $group: { _id: null, total: { $sum: "$hours" }, abnormal: { $sum: { $cond: ["$isInsufficient", 1, 0] } } } },
      ]),
      ConsumptionRecordModel.aggregate([
        { $match: { createdAt: { $gte: `${lastStartStr} 00:00:00`, $lte: `${lastEndStr} 23:59:59` } } },
        { $group: { _id: null, total: { $sum: "$hours" }, abnormal: { $sum: { $cond: ["$isInsufficient", 1, 0] } } } },
      ]),
      ConsumptionRecordModel.aggregate([
        { $match: { createdAt: { $gte: `${startStr} 00:00:00`, $lte: `${endStr} 23:59:59` } } },
        { $group: { _id: { studentId: "$studentId", name: "$studentName", className: "$className" }, total: { $sum: "$hours" } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      ConsumptionRecordModel.find({
        createdAt: { $gte: `${startStr} 00:00:00`, $lte: `${endStr} 23:59:59` },
        isInsufficient: true,
      }).sort({ createdAt: -1 }).limit(30).lean(),
      FeedbackModel.countDocuments({ createdAt: { $gte: `${startStr} 00:00:00`, $lte: `${endStr} 23:59:59` } }),
    ]);
  } catch {}

  const curRecords = demoStore.all("consumptionRecords").filter((d) => inDateRange(d.createdAt, startStr, endStr));
  const lastRecords = demoStore.all("consumptionRecords").filter((d) => inDateRange(d.createdAt, lastStartStr, lastEndStr));
  const totalHours = current[0]?.total ?? curRecords.reduce((s, r) => s + (r.hours || 0), 0);
  const totalHoursLast = lastMonthData[0]?.total ?? lastRecords.reduce((s, r) => s + (r.hours || 0), 0);

  if (abnormalList.length === 0) {
    abnormalList = curRecords.filter((r) => r.isInsufficient).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 30);
  }
  if (feedbackCount === 0) {
    feedbackCount = demoStore.all("feedbacks").filter((f) => inDateRange(f.createdAt, startStr, endStr)).length;
  }

  let topConsumptions;
  if (topList && topList.length > 0) {
    topConsumptions = topList.map((t) => ({ studentName: t._id.name, className: t._id.className || "-", hours: t.total }));
  } else {
    const byStu = new Map<string, { name: string; className: string; hours: number }>();
    for (const r of curRecords) {
      const cur = byStu.get(r.studentId) || { name: r.studentName, className: r.className || "-", hours: 0 };
      cur.hours += r.hours || 0;
      byStu.set(r.studentId, cur);
    }
    topConsumptions = [...byStu.values()].sort((a, b) => b.hours - a.hours).slice(0, 8);
  }

  const dailySeries = await getDailySeries({ startDate: startStr, endDate: endStr });

  return {
    periodLabel: `${year}年${month + 1}月`,
    totalHours,
    totalHoursLastMonth: totalHoursLast,
    hoursChangeRate: totalHoursLast === 0 ? 0 : Math.round(((totalHours - totalHoursLast) / totalHoursLast) * 100),
    abnormalCount: current[0]?.abnormal ?? curRecords.filter((r) => r.isInsufficient).length,
    abnormalCountLastMonth: lastMonthData[0]?.abnormal ?? lastRecords.filter((r) => r.isInsufficient).length,
    feedbackCount,
    topConsumptions,
    dailySeries,
    abnormalDetails: abnormalList.map((d: any) => ({ ...d, id: d._id?.toString() || d.id })),
  };
}

export async function getFeedbacks(query: ReportQuery) {
  const { startDate, endDate, studentId } = query;
  try {
    const filter: any = {
      createdAt: { $gte: `${startDate} 00:00:00`, $lte: `${endDate} 23:59:59` },
    };
    if (studentId) filter.studentId = studentId;
    const list = await FeedbackModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    if (list && list.length > 0) return list.map((f: any) => ({ ...f, id: f._id.toString() })) as Feedback[];
  } catch {}
  return demoStore
    .all("feedbacks")
    .filter((f) => inDateRange(f.createdAt, startDate, endDate))
    .filter((f) => !studentId || f.studentId === studentId)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 100) as Feedback[];
}
