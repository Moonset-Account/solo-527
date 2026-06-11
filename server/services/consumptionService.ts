import { StudentModel as SM } from "@/server/models/Student";
import { ClassScheduleModel as CSM } from "@/server/models/ClassSchedule";
import { ConsumptionRecordModel as CRM } from "@/server/models/ConsumptionRecord";
import { QuestionBankVersionModel as QBVM } from "@/server/models/QuestionBank";
import { ClassInfoModel as CIM } from "@/server/models/ClassInfo";
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
  const list = await ClassScheduleModel.find({ date: dateStr, status: "pending" })
    .sort({ startTime: 1 })
    .lean();
  const schedules = list as (ClassSchedule & { _id: any })[];
  const studentIds = [...new Set(schedules.flatMap((s) => s.studentIds))];
  const students = await StudentModel.find({ _id: { $in: studentIds } }).lean();
  const stuMap = new Map(students.map((s) => [s._id.toString(), { ...s, id: s._id.toString() }]));
  return schedules.map((s) => ({
    ...s,
    id: s._id.toString(),
    students: s.studentIds.map((sid) => stuMap.get(sid)).filter(Boolean) as any,
  })) as ClassSchedule[];
}

export async function getSchedulesByRange(start: Date, end: Date) {
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const list = await ClassScheduleModel.find({ date: { $gte: startStr, $lte: endStr } })
    .sort({ date: 1, startTime: 1 })
    .lean();
  return list.map((s) => ({ ...s, id: s._id.toString() })) as ClassSchedule[];
}

export async function getDashboardOverview(user: User): Promise<DashboardOverview> {
  const today = formatDate(new Date());
  const pending = await ClassScheduleModel.countDocuments({ date: today, status: "pending" });
  const alertStudents = await StudentModel.find({ remainingHours: { $lte: "$alertThreshold" } }).countDocuments();
  const insufficientStudents = await StudentModel.aggregate([
    { $match: { $expr: { $lte: ["$remainingHours", "$alertThreshold"] } } },
  ]);
  const consumedToday = await ConsumptionRecordModel.aggregate([
    { $match: { createdAt: { $regex: `^${today}` } } },
    { $group: { _id: null, total: { $sum: "$hours" } } },
  ]);
  const pendingReceipt = 0;
  return {
    pendingConsumptionCount: pending,
    insufficientAlertCount: insufficientStudents.length || alertStudents,
    pendingReceiptCount: pendingReceipt,
    todayConsumedHours: consumedToday[0]?.total || 0,
  };
}

export async function createConsumption(
  user: User,
  req: CreateConsumptionRequest,
  ip?: string
): Promise<CreateConsumptionResponse> {
  const schedule = await ClassScheduleModel.findById(req.scheduleId).lean();
  if (!schedule) throw new Error("课次不存在");
  const version = await QuestionBankVersionModel.findById(req.questionBankVersionId).lean();
  if (!version) throw new Error("题库版本不存在");

  const studentIds = req.items.map((i) => i.studentId);
  const students = await StudentModel.find({ _id: { $in: studentIds } }).lean();
  const stuMap = new Map<string, any>(students.map((s: any) => [s._id.toString(), s]));

  const allClasses = await ClassInfoModel.find().lean();
  const classMap = new Map<string, string>(allClasses.map((c: any) => [c._id.toString(), c.name]));

  const records: ConsumptionRecord[] = [];
  const insufficientAlerts: InsufficientAlert[] = [];
  const now = formatDateTime(new Date());

  for (const item of req.items) {
    const stu = stuMap.get(item.studentId);
    if (!stu) continue;
    const isInsufficient = stu.remainingHours < item.hours;
    const shortage = isInsufficient ? item.hours - stu.remainingHours : 0;
    const actualDeduct = Math.min(stu.remainingHours, item.hours);

    await StudentModel.updateOne({ _id: stu._id }, { $inc: { remainingHours: -actualDeduct } });

    const doc = await ConsumptionRecordModel.create({
      scheduleId: schedule._id.toString(),
      classId: schedule.classId,
      className: schedule.className || classMap.get(schedule.classId),
      studentId: stu._id.toString(),
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

    const record = { ...doc.toObject(), id: doc._id.toString() } as ConsumptionRecord;
    records.push(record);

    if (isInsufficient || stu.remainingHours <= stu.alertThreshold) {
      insufficientAlerts.push({
        studentId: stu._id.toString(),
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
      doc._id.toString(),
      {
        studentName: stu.name,
        hours: item.hours,
        version: version.version,
        isInsufficient,
        shortage,
      },
      ip
    );
  }

  await ClassScheduleModel.updateOne({ _id: schedule._id }, { status: "completed" });

  return { success: true, records, insufficientAlerts };
}

export async function getInsufficientAlerts(): Promise<InsufficientAlert[]> {
  const students = await StudentModel.aggregate([
    { $match: { $expr: { $lte: ["$remainingHours", "$alertThreshold"] } } },
    { $limit: 20 },
  ]);
  const classIds = [...new Set(students.map((s: any) => s.classId))];
  const classes = await ClassInfoModel.find({ _id: { $in: classIds } }).lean();
  const classMap = new Map(classes.map((c) => [c._id.toString(), c.name]));
  return students.map((s: any) => ({
    studentId: s._id.toString(),
    studentName: s.name,
    className: classMap.get(s.classId) || "",
    parentPhone: s.parentPhone,
    remaining: s.remainingHours,
    shortage: 0,
    scheduledHours: 0,
    threshold: s.alertThreshold,
  })) as InsufficientAlert[];
}
