import { ConsumptionRecordModel as CRM } from "@/server/models/ConsumptionRecord";
import { FeedbackModel as FM } from "@/server/models/Feedback";
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

export async function queryConsumptionRecords(query: ReportQuery) {
  const filter: any = {
    createdAt: { $gte: `${query.startDate} 00:00:00`, $lte: `${query.endDate} 23:59:59` },
  };
  if (query.classId) filter.classId = query.classId;
  if (query.studentId) filter.studentId = query.studentId;

  const docs = await ConsumptionRecordModel.find(filter).sort({ createdAt: -1 }).lean();
  const ids = docs.map((d) => d._id.toString());

  const [feedbacks, auditLogsMap] = await Promise.all([
    FeedbackModel.find({ consumptionId: { $in: ids } }).lean(),
    Promise.all(
      ids.map(async (id) => ({ id, logs: await queryAuditLogsByTarget("consumption", id, 5) }))
    ),
  ]);

  const feedbackMap = new Map(feedbacks.map((f) => [f.consumptionId, f]));
  const auditMap = new Map(auditLogsMap.map((a) => [a.id, a.logs]));

  return docs.map((d) => {
    const id = d._id.toString();
    const fb = feedbackMap.get(id) as any;
    return {
      ...d,
      id,
      auditLogs: auditMap.get(id) || [],
      feedback: fb
        ? ({ ...fb, id: fb._id.toString() } as Feedback)
        : undefined,
    } as ConsumptionRecord;
  });
}

export async function getDailySeries(query: ReportQuery): Promise<DailyReportItem[]> {
  const docs = await ConsumptionRecordModel.aggregate([
    {
      $match: {
        createdAt: { $gte: `${query.startDate} 00:00:00`, $lte: `${query.endDate} 23:59:59` },
        ...(query.classId ? { classId: query.classId } : {}),
        ...(query.studentId ? { studentId: query.studentId } : {}),
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
  return docs.map((d) => ({
    date: d._id,
    totalHours: d.totalHours,
    studentCount: Array.isArray(d.studentCount) ? d.studentCount.length : 0,
    abnormalCount: d.abnormalCount,
    totalRecords: d.totalRecords,
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

  const [current, lastMonthData, topList, abnormalList, feedbackCount] = await Promise.all([
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
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    FeedbackModel.countDocuments({ createdAt: { $gte: `${startStr} 00:00:00`, $lte: `${endStr} 23:59:59` } }),
  ]);

  const totalHours = current[0]?.total || 0;
  const totalHoursLast = lastMonthData[0]?.total || 0;
  const dailySeries = await getDailySeries({ startDate: startStr, endDate: endStr });

  return {
    periodLabel: `${year}年${month + 1}月`,
    totalHours,
    totalHoursLastMonth: totalHoursLast,
    hoursChangeRate: totalHoursLast === 0 ? 0 : Math.round(((totalHours - totalHoursLast) / totalHoursLast) * 100),
    abnormalCount: current[0]?.abnormal || 0,
    abnormalCountLastMonth: lastMonthData[0]?.abnormal || 0,
    feedbackCount,
    topConsumptions: topList.map((t) => ({
      studentName: t._id.name,
      className: t._id.className || "-",
      hours: t.total,
    })),
    dailySeries,
    abnormalDetails: abnormalList.map((d: any) => ({ ...d, id: d._id.toString() })),
  };
}

export async function getFeedbacks(query: ReportQuery) {
  const filter: any = {
    createdAt: { $gte: `${query.startDate} 00:00:00`, $lte: `${query.endDate} 23:59:59` },
  };
  if (query.studentId) filter.studentId = query.studentId;
  const list = await FeedbackModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  return list.map((f: any) => ({ ...f, id: f._id.toString() })) as Feedback[];
}
