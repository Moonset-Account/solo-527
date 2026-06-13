import { NoticeModel as NM, NoticeReceiptModel as NRM } from "@/server/models/Notice";
import { StudentModel as SM } from "@/server/models/Student";
import { demoStore } from "@/server/db/demoData";
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
  try {
    const docs = await NoticeModel.find().sort({ publishedAt: -1 }).limit(limit).lean();
    if (docs && docs.length > 0) return docs.map((d: any) => ({ ...d, id: d._id.toString() })) as Notice[];
  } catch {}
  return demoStore.all("notices").slice(0, limit) as Notice[];
}

export async function createNotice(
  user: User,
  req: CreateNoticeRequest,
  ip?: string
): Promise<Notice> {
  const now = formatDateTime(new Date());
  let doc: any;
  try {
    doc = await NoticeModel.create({
      title: req.title,
      content: req.content,
      senderId: user.id,
      senderName: user.name,
      targetType: req.targetType,
      targetIds: req.targetIds,
      publishedAt: now,
      receiptDeadline: req.receiptDeadline,
    });
  } catch {
    doc = demoStore.create("notices", {
      title: req.title,
      content: req.content,
      senderId: user.id,
      senderName: user.name,
      targetType: req.targetType,
      targetIds: req.targetIds,
      publishedAt: now,
      receiptDeadline: req.receiptDeadline,
    });
  }

  let receiptStudentIds: string[] = [];
  try {
    if (req.targetType === "all") {
      receiptStudentIds = (await StudentModel.find({}, "_id").lean()).map((s: any) => s._id.toString());
    } else if (req.targetType === "class") {
      receiptStudentIds = (await StudentModel.find({ classId: { $in: req.targetIds } }, "_id").lean()).map((s: any) => s._id.toString());
    } else {
      receiptStudentIds = req.targetIds;
    }
  } catch {
    receiptStudentIds = demoStore.all("students").map((s) => s._id);
  }

  let studentDetails: any[] = [];
  try {
    studentDetails = await StudentModel.find({ _id: { $in: receiptStudentIds } }).lean();
  } catch {
    studentDetails = demoStore.find("students", { _id: { $in: receiptStudentIds } as any });
  }
  if (studentDetails.length === 0) studentDetails = demoStore.all("students");

  const receipts = studentDetails.map((s) => ({
    noticeId: doc._id?.toString() || doc.id,
    studentId: s._id?.toString() || s.id,
    studentName: s.name,
    parentPhone: s.parentPhone,
    isRead: false,
    isConfirmed: false,
  }));
  if (receipts.length > 0) {
    try {
      await NoticeReceiptModel.insertMany(receipts, { ordered: false }).catch(() => {});
    } catch {
      receipts.forEach((r) => demoStore.create("noticeReceipts", r));
    }
  }

  await writeAudit(
    user,
    "publish_notice",
    "notice",
    doc._id?.toString() || doc.id,
    { title: req.title, targetType: req.targetType, recipients: receipts.length },
    ip
  );

  return { ...doc, id: doc._id?.toString() || doc.id } as Notice;
}

export async function getReceiptsByNotice(noticeId: string) {
  try {
    const docs = await NoticeReceiptModel.find({ noticeId }).lean();
    if (docs && docs.length > 0) return docs.map((d: any) => ({ ...d, id: d._id.toString() })) as NoticeReceipt[];
  } catch {}
  return demoStore.find("noticeReceipts", { noticeId }) as NoticeReceipt[];
}

export async function getReceiptStats(noticeId: string) {
  let docs: any[] = [];
  try {
    docs = await NoticeReceiptModel.find({ noticeId }).lean();
  } catch {}
  if (docs.length === 0) docs = demoStore.find("noticeReceipts", { noticeId });
  const total = docs.length;
  const confirmed = docs.filter((d) => d.isConfirmed).length;
  const read = docs.filter((d) => d.isRead).length;
  const unread = total - read;
  const unconfirmed = total - confirmed;
  const overdue = docs.filter(
    (d) => !d.isConfirmed && new Date(d.confirmedAt || d.updatedAt || d.createdAt || 0) < new Date()
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

  let receipt: any = null;
  try {
    await NoticeReceiptModel.updateOne({ _id: receiptId }, update);
    receipt = await NoticeReceiptModel.findById(receiptId).lean();
  } catch {}
  if (!receipt) {
    demoStore.updateMany("noticeReceipts", { _id: receiptId }, update);
    receipt = demoStore.findById("noticeReceipts", receiptId);
  }

  if (feedback && receipt) {
    const { FeedbackModel: FM } = await import("@/server/models/Feedback");
    const FeedbackModel: any = FM;
    const stuName = receipt.studentName || "";
    let studentId = receipt.studentId;
    if (!studentId) {
      try {
        const stu = await StudentModel.findOne({ name: stuName }).lean();
        if (stu) studentId = stu._id?.toString() || stu.id;
      } catch {}
      if (!studentId) {
        const stu = demoStore.findOne("students", { name: stuName });
        if (stu) studentId = stu._id?.toString() || stu.id;
      }
    }
    const feedbackDoc: any = {
      studentId: studentId || receipt._id?.toString() || receiptId,
      studentName: stuName,
      content: feedback,
      rating: 5,
      createdAt: now,
      writerRole: "parent",
      source: "notice_receipt",
      noticeReceiptId: receipt._id?.toString() || receiptId,
    };
    try {
      await FeedbackModel.create(feedbackDoc);
    } catch {
      demoStore.create("feedbacks", feedbackDoc);
    }
  }

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
  let doc: any;
  try {
    doc = await FeedbackModel2.create({
      studentId,
      studentName,
      consumptionId,
      content,
      rating,
      createdAt: now,
      writerRole: user?.role === "teacher" || user?.role === "admin" ? "teacher" : "parent",
    });
  } catch {
    doc = demoStore.create("feedbacks", {
      studentId,
      studentName,
      consumptionId,
      content,
      rating,
      createdAt: now,
      writerRole: user?.role === "teacher" || user?.role === "admin" ? "teacher" : "parent",
    });
  }
  if (user) {
    await writeAudit(user, "create_feedback", "feedback", doc._id?.toString() || doc.id, { studentId, content }, ip);
  }
  return doc;
}

export async function runReminderCron() {
  let unreceipted: any[] = [];
  try {
    unreceipted = await NoticeReceiptModel.find({ isConfirmed: false }).lean();
  } catch {}
  if (unreceipted.length === 0) unreceipted = demoStore.find("noticeReceipts", { isConfirmed: false });
  const toRemind = unreceipted.filter(
    (r) => new Date(r.createdAt || 0).getTime() < Date.now() - 24 * 3600 * 1000
  );
  if (toRemind.length > 0) {
    console.log(`[Cron] Found ${toRemind.length} unreceipted notices to remind`);
  }
  return toRemind;
}

export async function batchRemindUnreceipted(user: User, ip?: string) {
  const now = formatDateTime(new Date());
  let unreceipted: any[] = [];
  try {
    unreceipted = await NoticeReceiptModel.find({ isConfirmed: false }).lean();
  } catch {}
  if (unreceipted.length === 0) unreceipted = demoStore.find("noticeReceipts", { isConfirmed: false });
  if (unreceipted.length === 0) return { count: 0 };

  const noticeIds: string[] = [...new Set(unreceipted.map((r: any) => (r.noticeId?.toString || (() => r.noticeId))()))];
  const ids: string[] = unreceipted.map((r: any) => (r._id?.toString || (() => r._id || r.id))());

  try {
    await NoticeReceiptModel.updateMany({ _id: { $in: ids } }, { $set: { remindedAt: now } }).catch(() => {});
  } catch {}
  demoStore.updateMany("noticeReceipts", { _id: { $in: ids } as any }, { remindedAt: now });

  try {
    const redis = (await import("@/server/db/redis")).getRedis();
    if (redis.status === "ready") {
      const rk = (await import("@/server/db/redis")).redisKeys;
      for (const nid of noticeIds) {
        const receiptIdsForNotice = ids.filter((_id) =>
          unreceipted.some((r: any) => (r.noticeId?.toString() === nid || r.noticeId === nid) && ((r._id?.toString() || r._id || r.id) === _id))
        );
        if (receiptIdsForNotice.length > 0) {
          const args: string[] = receiptIdsForNotice.flatMap((rid) => [String(Date.now()), rid]);
          await (redis as any).zadd(rk.noticeReminder(nid), ...args).catch(() => {});
        }
      }
    }
  } catch {}

  await writeAudit(
    user,
    "publish_notice",
    "notice",
    `batch-remind-${Date.now()}`,
    { action: "batch_remind", noticeCount: noticeIds.length, receiptCount: unreceipted.length },
    ip
  );

  return { count: unreceipted.length, noticeIds };
}
