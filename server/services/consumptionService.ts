import { StudentModel as SM } from "@/server/models/Student";
import { ClassScheduleModel as CSM } from "@/server/models/ClassSchedule";
import { ConsumptionRecordModel as CRM } from "@/server/models/ConsumptionRecord";
import { QuestionBankVersionModel as QBVM } from "@/server/models/QuestionBank";
import { ClassInfoModel as CIM } from "@/server/models/ClassInfo";
import { demoStore } from "@/server/db/demoData";
import type {
  ConsumptionRecord,
  CreateConsumptionRequest,
  CreateConsumptionResponse,
  ClassSchedule,
  InsufficientAlert,
  User,
  DashboardOverview,
} from "@/shared/types";
import { formatDate, formatDateTime } from "@/shared/utils";
import { writeAudit } from "./auditService";

const StudentModel: any = SM;
const ClassScheduleModel: any = CSM;
const ConsumptionRecordModel: any = CRM;
const QuestionBankVersionModel: any = QBVM;
const ClassInfoModel: any = CIM;

export async function getTodaySchedules(date = new Date()) {
  const dateStr = formatDate(date);
  let schedules: any[] = [];
  try {
    schedules = await ClassScheduleModel.find({ date: dateStr, status: "pending" }).sort({ startTime: 1 }).lean();
  } catch {}
  if (schedules.length === 0) {
    schedules = demoStore.find("classSchedules", { date: dateStr, status: "pending" })
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }
  let students: any[] = [];
  try {
    const studentIds = [...new Set(schedules.flatMap((s) => s.studentIds))];
    students = await StudentModel.find({ _id: { $in: studentIds } }).lean();
  } catch {}
  if (students.length === 0) {
    const studentIds = [...new Set(schedules.flatMap((s: any) => s.studentIds || []))];
    students = demoStore.find("students", { _id: { $in: studentIds } as any });
    if (students.length === 0) students = demoStore.all("students");
  }
  const stuMap = new Map(students.map((s) => [s._id?.toString() || s.id, { ...s, id: s._id?.toString() || s.id }]));
  return schedules.map((s) => ({
    ...s,
    id: s._id?.toString() || s.id,
    students: (s.studentIds || []).map((sid: string) => stuMap.get(sid)).filter(Boolean),
  })) as ClassSchedule[];
}

export async function getSchedulesByRange(start: Date, end: Date) {
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  let list: any[] = [];
  try {
    list = await ClassScheduleModel.find({ date: { $gte: startStr, $lte: endStr } }).sort({ date: 1, startTime: 1 }).lean();
  } catch {}
  if (list.length === 0) {
    list = demoStore.all("classSchedules")
      .filter((s) => s.date >= startStr && s.date <= endStr)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }
  return list.map((s) => ({ ...s, id: s._id?.toString() || s.id })) as ClassSchedule[];
}

export async function getDashboardOverview(user: User): Promise<DashboardOverview> {
  const today = formatDate(new Date());
  let pending = 0;
  let alertStudents: any[] = [];
  let consumedToday: any[] = [];
  try {
    pending = await ClassScheduleModel.countDocuments({ date: today, status: "pending" });
    alertStudents = await StudentModel.aggregate([
      { $match: { $expr: { $lte: ["$remainingHours", "$alertThreshold"] } } },
    ]);
    consumedToday = await ConsumptionRecordModel.aggregate([
      { $match: { createdAt: { $regex: `^${today}` } } },
      { $group: { _id: null, total: { $sum: "$hours" } } },
    ]);
  } catch {}

  if (pending === 0) pending = demoStore.find("classSchedules", { date: today, status: "pending" }).length;
  if (alertStudents.length === 0) {
    alertStudents = demoStore.all("students").filter((s) => s.remainingHours <= s.alertThreshold);
  }
  let consumedHours = consumedToday[0]?.total || 0;
  if (consumedHours === 0) {
    consumedHours = demoStore.all("consumptionRecords")
      .filter((r) => (r.createdAt || "").slice(0, 10) === today)
      .reduce((s, r) => s + (r.hours || 0), 0);
  }
  let pendingReceipt = 0;
  try {
    const { NoticeReceiptModel: NRM } = await import("@/server/models/Notice");
    pendingReceipt = await (NRM as any).countDocuments({ isConfirmed: false });
  } catch {
    pendingReceipt = demoStore.find("noticeReceipts", { isConfirmed: false }).length;
  }

  return {
    pendingConsumptionCount: pending,
    insufficientAlertCount: alertStudents.length,
    pendingReceiptCount: pendingReceipt,
    todayConsumedHours: consumedHours,
  };
}

export async function createConsumption(
  user: User,
  req: CreateConsumptionRequest,
  ip?: string
): Promise<CreateConsumptionResponse> {
  let schedule: any = null;
  try {
    schedule = await ClassScheduleModel.findById(req.scheduleId).lean();
  } catch {}
  if (!schedule) schedule = demoStore.findById("classSchedules", req.scheduleId);
  if (!schedule) throw new Error("课次不存在");

  let version: any = null;
  try {
    version = await QuestionBankVersionModel.findById(req.questionBankVersionId).lean();
  } catch {}
  if (!version) version = demoStore.findById("questionBankVersions", req.questionBankVersionId);
  if (!version) throw new Error("题库版本不存在");

  const studentIds = req.items.map((i) => i.studentId);
  let students: any[] = [];
  try {
    students = await StudentModel.find({ _id: { $in: studentIds } }).lean();
  } catch {}
  if (students.length === 0) {
    students = demoStore.find("students", { _id: { $in: studentIds } as any });
    if (students.length === 0) students = studentIds.map((id) => demoStore.findById("students", id)).filter(Boolean);
  }
  const stuMap = new Map<string, any>(students.map((s: any) => [s._id?.toString() || s.id, s]));

  let allClasses: any[] = [];
  try {
    allClasses = await ClassInfoModel.find().lean();
  } catch {}
  if (allClasses.length === 0) allClasses = demoStore.all("classes");
  const classMap = new Map<string, string>(allClasses.map((c: any) => [c._id?.toString() || c.id, c.name]));

  const records: ConsumptionRecord[] = [];
  const insufficientAlerts: InsufficientAlert[] = [];
  const now = formatDateTime(new Date());

  for (const item of req.items) {
    const stu = stuMap.get(item.studentId);
    if (!stu) continue;
    const isInsufficient = stu.remainingHours < item.hours;
    const shortage = isInsufficient ? item.hours - stu.remainingHours : 0;
    const actualDeduct = Math.min(stu.remainingHours, item.hours);

    try {
      await StudentModel.updateOne({ _id: stu._id || stu.id }, { $inc: { remainingHours: -actualDeduct } });
    } catch {}
    demoStore.updateMany("students", { _id: stu._id || stu.id }, { $inc: undefined as any, remainingHours: Math.max(0, stu.remainingHours - actualDeduct) });

    let doc: any;
    try {
      doc = await ConsumptionRecordModel.create({
        scheduleId: schedule._id?.toString() || schedule.id,
        classId: schedule.classId,
        className: schedule.className || classMap.get(schedule.classId),
        studentId: stu._id?.toString() || stu.id,
        studentName: stu.name,
        hours: item.hours,
        operatorId: user.id,
        operatorName: user.name,
        questionBankVersionId: req.questionBankVersionId,
        questionBankVersionName: version.version + " - " + (version.bankName || ""),
        remark: req.remark,
        isInsufficient,
        insufficientHours: shortage,
        createdAt: now,
      });
    } catch {
      doc = demoStore.create("consumptionRecords", {
        scheduleId: schedule._id?.toString() || schedule.id,
        classId: schedule.classId,
        className: schedule.className || classMap.get(schedule.classId),
        studentId: stu._id?.toString() || stu.id,
        studentName: stu.name,
        hours: item.hours,
        operatorId: user.id,
        operatorName: user.name,
        questionBankVersionId: req.questionBankVersionId,
        questionBankVersionName: version.version + " - " + (version.bankName || ""),
        remark: req.remark,
        isInsufficient,
        insufficientHours: shortage,
        createdAt: now,
        auditLogs: [],
        feedback: null,
      });
    }

    const record = { ...(doc.toObject ? doc.toObject() : doc), id: doc._id?.toString() || doc.id } as ConsumptionRecord;
    records.push(record);

    if (isInsufficient || stu.remainingHours <= stu.alertThreshold) {
      insufficientAlerts.push({
        studentId: stu._id?.toString() || stu.id,
        studentName: stu.name,
        className: schedule.className || classMap.get(schedule.classId) || "",
        parentPhone: stu.parentPhone,
        remaining: Math.max(0, stu.remainingHours - actualDeduct),
        shortage,
        scheduledHours: item.hours,
        threshold: stu.alertThreshold,
      });
    }

    await writeAudit(
      user,
      "create_consumption",
      "consumption",
      doc._id?.toString() || doc.id,
      { studentName: stu.name, hours: item.hours, version: version.version, isInsufficient, shortage },
      ip
    );
  }

  try {
    await ClassScheduleModel.updateOne({ _id: schedule._id || schedule.id }, { status: "completed" });
  } catch {}
  demoStore.updateMany("classSchedules", { _id: schedule._id || schedule.id }, { status: "completed" });

  return { success: true, records, insufficientAlerts };
}

export async function getInsufficientAlerts(): Promise<InsufficientAlert[]> {
  let students: any[] = [];
  try {
    students = await StudentModel.aggregate([
      { $match: { $expr: { $lte: ["$remainingHours", "$alertThreshold"] } } },
      { $limit: 20 },
    ]);
  } catch {}
  if (students.length === 0) {
    students = demoStore.all("students").filter((s) => s.remainingHours <= s.alertThreshold).slice(0, 20);
  }
  const classIds = [...new Set(students.map((s: any) => s.classId))];
  let classes: any[] = [];
  try {
    classes = await ClassInfoModel.find({ _id: { $in: classIds } }).lean();
  } catch {}
  if (classes.length === 0) classes = demoStore.find("classes", { _id: { $in: classIds } as any });
  const classMap = new Map(classes.map((c: any) => [c._id?.toString() || c.id, c.name]));
  return students.map((s: any) => ({
    studentId: s._id?.toString() || s.id,
    studentName: s.name,
    className: classMap.get(s.classId) || "",
    parentPhone: s.parentPhone,
    remaining: s.remainingHours,
    shortage: 0,
    scheduledHours: 0,
    threshold: s.alertThreshold,
  })) as InsufficientAlert[];
}
