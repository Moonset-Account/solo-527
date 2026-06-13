export type UserRole = "teacher" | "operator" | "admin";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
  passwordHash?: string;
  createdAt?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  level: string;
  teacherIds: string[];
}

export interface Student {
  id: string;
  name: string;
  parentPhone: string;
  remainingHours: number;
  classId: string;
  className?: string;
  alertThreshold: number;
  createdAt?: string;
}

export type ScheduleStatus = "pending" | "completed" | "cancelled";

export interface ClassSchedule {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  questionBankVersionId: string;
  questionBankVersionName?: string;
  status: ScheduleStatus;
  studentIds: string[];
  students?: Student[];
}

export interface ConsumptionRecord {
  id: string;
  scheduleId: string;
  classId?: string;
  className?: string;
  studentId: string;
  studentName: string;
  hours: number;
  operatorId: string;
  operatorName: string;
  questionBankVersionId: string;
  questionBankVersionName: string;
  remark?: string;
  isInsufficient: boolean;
  insufficientHours?: number;
  auditLogs?: AuditLog[];
  feedback?: Feedback;
  createdAt: string;
}

export type AuditAction =
  | "create_consumption"
  | "update_schedule"
  | "publish_notice"
  | "adjust_hours"
  | "login"
  | "logout"
  | "create_feedback"
  | "confirm_receipt";

export type AuditTargetType =
  | "consumption"
  | "schedule"
  | "notice"
  | "student"
  | "feedback"
  | "receipt"
  | "user";

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  detail: Record<string, any>;
  ip?: string;
  createdAt: string;
}

export interface QuestionBank {
  id: string;
  name: string;
  subject: string;
}

export interface QuestionBankVersion {
  id: string;
  bankId: string;
  bankName?: string;
  version: string;
  isActive: boolean;
  publishedAt: string;
  classIds?: string[];
}

export type NoticeTargetType = "all" | "class" | "students";

export interface Notice {
  id: string;
  title: string;
  content: string;
  templateId?: string;
  senderId: string;
  senderName?: string;
  targetType: NoticeTargetType;
  targetIds: string[];
  publishedAt: string;
  receiptDeadline: string;
}

export interface NoticeReceipt {
  id: string;
  noticeId: string;
  studentId: string;
  studentName?: string;
  parentName?: string;
  parentPhone?: string;
  isRead: boolean;
  isConfirmed: boolean;
  feedback?: string;
  readAt?: string;
  confirmedAt?: string;
}

export interface Feedback {
  id: string;
  studentId: string;
  studentName?: string;
  consumptionId?: string;
  noticeReceiptId?: string;
  source?: "consumption" | "notice_receipt" | "manual";
  content: string;
  rating?: number;
  createdAt: string;
  writerRole: "parent" | "teacher";
}

export interface InsufficientAlert {
  studentId: string;
  studentName: string;
  className: string;
  parentPhone: string;
  remaining: number;
  shortage: number;
  scheduledHours: number;
  threshold: number;
}

export interface DashboardOverview {
  pendingConsumptionCount: number;
  insufficientAlertCount: number;
  pendingReceiptCount: number;
  todayConsumedHours: number;
}

export interface CreateConsumptionRequest {
  scheduleId: string;
  items: { studentId: string; hours: number }[];
  questionBankVersionId: string;
  remark?: string;
}

export interface CreateConsumptionResponse {
  success: boolean;
  records: ConsumptionRecord[];
  insufficientAlerts: InsufficientAlert[];
}

export interface CreateNoticeRequest {
  title: string;
  content: string;
  templateId?: string;
  targetType: NoticeTargetType;
  targetIds: string[];
  receiptDeadline?: string;
}

export interface ReportQuery {
  startDate: string;
  endDate: string;
  classId?: string;
  studentId?: string;
}

export interface DailyReportItem {
  date: string;
  totalHours: number;
  studentCount: number;
  abnormalCount: number;
  totalRecords: number;
}

export interface MonthlyReport {
  periodLabel: string;
  totalHours: number;
  totalHoursLastMonth: number;
  hoursChangeRate: number;
  abnormalCount: number;
  abnormalCountLastMonth: number;
  feedbackCount: number;
  topConsumptions: { studentName: string; hours: number; className: string }[];
  dailySeries: DailyReportItem[];
  abnormalDetails: ConsumptionRecord[];
}
