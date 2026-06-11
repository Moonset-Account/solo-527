import { NoticeModel as NM, NoticeReceiptModel as NRM } from "@/server/models/Notice";
import { StudentModel as SM } from "@/server/models/Student";
import type {
  CreateNoticeRequest,
  Notice,
  NoticeReceipt,
  User,
} from "@/shared/types";
import { formatDateTime } from "@/shared/utils";
import { writeAudit } from "./auditService";

const NoticeModel: any = NM;
const NoticeReceiptModel: any = NRM;
const StudentModel: any = SM;

export async function listNotices(limit = 50) {
  const docs = await NoticeModel.find().sort({ publishedAt: -1 }).limit(limit).lean();
  return docs.map((d) => ({ ...d, id: d._id.toString() })) as Notice[];
}

export async function createNotice(
  user: User,
  req: CreateNoticeRequest,
  ip?: string
): Promise<Notice> {
  const now = formatDateTime(new Date());
  const doc = await NoticeModel.create({
    title: req.title,
    content: req.content,
    senderId: user.id,
    senderName: user.name,
    targetType: req.targetType,
    targetIds: req.targetIds,
    publishedAt: now,
    receiptDeadline: req.receiptDeadline,
  });

  let receiptStudentIds: string[] = [];
  if (req.targetType === "all") {
    receiptStudentIds = (await StudentModel.find({}, "_id").lean()).map((s) => s._id.toString());
  } else if (req.targetType === "class") {
    receiptStudentIds = (await StudentModel.find({ classId: { $in: req.targetIds } }, "_id").lean()).map((s) => s._id.toString());
  } else {
    receiptStudentIds = req.targetIds;
  }

  const studentDetails = await StudentModel.find({ _id: { $in: receiptStudentIds } }).lean();
  const receipts = studentDetails.map((s) => ({
    noticeId: doc._id.toString(),
    studentId: s._id.toString(),
    studentName: s.name,
    parentPhone: s.parentPhone,
    isRead: false,
    isConfirmed: false,
  }));
  if (receipts.length > 0) {
    await NoticeReceiptModel.insertMany(receipts, { ordered: false }).catch(() => {});
  }

  await writeAudit(
    user,
    "publish_notice",
    "notice",
    doc._id.toString(),
    { title: req.title, targetType: req.targetType, recipients: receipts.length },
    ip
  );

  return { ...doc.toObject(), id: doc._id.toString() } as Notice;
}

export async function getReceiptsByNotice(noticeId: string) {
  const docs = await NoticeReceiptModel.find({ noticeId }).lean();
  return docs.map((d) => ({ ...d, id: d._id.toString() })) as NoticeReceipt[];
}

export async function getReceiptStats(noticeId: string) {
  const docs = await NoticeReceiptModel.find({ noticeId }).lean();
  const total = docs.length;
  const confirmed = docs.filter((d) => d.isConfirmed).length;
  const read = docs.filter((d) => d.isRead).length;
  const unread = total - read;
  const unconfirmed = total - confirmed;
  const overdue = docs.filter(
    (d) => !d.isConfirmed && new Date(d.confirmedAt || d.updatedAt) < new Date()
  ).length;
  return { total, confirmed, read, unread, unconfirmed, overdue };
}

export async function confirmReceipt(
  user: User,
  receiptId: string,
  feedback?: string,
  ip?: string
) {
  const now = formatDateTime(new Date());
  const update: any = { isConfirmed: true, confirmedAt: now };
  if (feedback) update.feedback = feedback;
  await NoticeReceiptModel.updateOne({ _id: receiptId }, update);
  await writeAudit(user, "confirm_receipt", "receipt", receiptId, { feedback }, ip);
}

export async function submitFeedback(
  studentId: string,
  studentName: string,
  consumptionId: string | undefined,
  content: string,
  rating?: number,
  user?: User,
  ip?: string
) {
  const { FeedbackModel: FM2 } = await import("@/server/models/Feedback");
  const FeedbackModel2: any = FM2;
  const now = formatDateTime(new Date());
  const doc = await FeedbackModel2.create({
    studentId,
    studentName,
    consumptionId,
    content,
    rating,
    createdAt: now,
    writerRole: user?.role === "teacher" || user?.role === "admin" ? "teacher" : "parent",
  });
  if (user) {
    await writeAudit(user, "create_feedback", "feedback", doc._id.toString(), { studentId, content }, ip);
  }
  return doc;
}

export async function runReminderCron() {
  const deadline = formatDateTime(new Date(Date.now() - 24 * 3600 * 1000));
  const overdue = await NoticeReceiptModel.find({
    isConfirmed: false,
  }).lean();
  const toRemind = overdue.filter(
    (r) => new Date((r as any).createdAt).getTime() < Date.now() - 24 * 3600 * 1000
  );
  if (toRemind.length > 0) {
    console.log(`[Cron] Found ${toRemind.length} unreceipted notices to remind`);
  }
  return toRemind;
}
