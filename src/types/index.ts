export type Role = "PRINCIPAL" | "ACADEMIC_AFFAIRS" | "TEACHING_LEAD" | "FINANCE";
export type LeadStatus = "NEW" | "FOLLOWING" | "TRIAL_SCHEDULED" | "TRIAL_DONE" | "CONVERTED" | "LOST" | "ARCHIVED";
export type LeadLevel = "HOT" | "WARM" | "COLD";
export type FollowUpType = "PHONE" | "WECHAT" | "VISIT" | "OTHER";
export type TrialStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type IntentionLevel = "HIGH" | "MEDIUM" | "LOW";
export type ClassStatus = "PENDING" | "ONGOING" | "FINISHED" | "SUSPENDED";
export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
export type LessonStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE";
export type ConsumptionStatus = "NORMAL" | "EXCEPTION" | "RECONCILED";
export type FeedbackReadStatus = "UNREAD" | "READ";
export type ExportTaskStatus = "PROCESSING" | "DONE" | "FAILED";
export type Major = "FINE_ARTS" | "DESIGN" | "MEDIA" | "MUSIC" | "DANCE" | "OTHER";

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Staff extends BaseEntity {
  clerkUserId: string;
  campusId: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
}

export interface Campus extends BaseEntity {
  name: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
}

export interface Lead extends BaseEntity {
  campusId: string;
  name: string;
  phone: string;
  parentName?: string;
  source?: string;
  intendedMajor?: Major;
  status: LeadStatus;
  level: LeadLevel;
  assigneeId?: string;
  tags: string[];
  remark?: string;
}

export interface FollowUp extends BaseEntity {
  leadId: string;
  staffId: string;
  type: FollowUpType;
  content: string;
  nextFollowAt?: Date;
}

export interface Trial extends BaseEntity {
  leadId: string;
  scheduledById: string;
  trialAt: Date;
  durationMinutes: number;
  className?: string;
  teacherName?: string;
  status: TrialStatus;
  followedUp: boolean;
  satisfaction?: number;
  parentFeedback?: string;
  intentionLevel?: IntentionLevel;
  teacherRemark?: string;
}

export interface Student extends BaseEntity {
  campusId: string;
  leadId?: string;
  name: string;
  gender?: string;
  birthday?: Date;
  grade?: string;
  phone?: string;
  totalHours: number;
  remainingHours: number;
  status: StudentStatus;
  remark?: string;
}

export interface Class extends BaseEntity {
  campusId: string;
  name: string;
  major: Major;
  questionBankVersionId?: string;
  totalHours: number;
  maxStudents: number;
  status: ClassStatus;
  remark?: string;
  startDate?: Date;
  endDate?: Date;
  teacherIds: string[];
  studentIds: string[];
}

export interface Lesson extends BaseEntity {
  classId: string;
  title: string;
  startAt: Date;
  durationHours: number;
  status: LessonStatus;
  room?: string;
  teacherRemark?: string;
}

export interface Attendance extends BaseEntity {
  lessonId: string;
  studentId: string;
  status: AttendanceStatus;
  remark?: string;
  signedAt?: Date;
}

export interface Consumption extends BaseEntity {
  lessonId: string;
  studentId: string;
  classId: string;
  operatorId: string;
  hours: number;
  status: ConsumptionStatus;
  remark?: string;
}

export interface Revision extends BaseEntity {
  consumptionId: string;
  beforeData?: any;
  afterData?: any;
  operatorId?: string;
}

export interface Work extends BaseEntity {
  studentId: string;
  title: string;
  imageUrl: string;
  submittedAt: Date;
  remark?: string;
}

export interface WorkFeedback extends BaseEntity {
  workId: string;
  teacherId: string;
  compositionScore: number;
  colorScore: number;
  creativityScore: number;
  techniqueScore: number;
  overallScore: number;
  comment: string;
}

export interface QuestionBankVersion extends BaseEntity {
  questionBankId: string;
  versionNo: string;
  enabledAt: Date;
  changelog?: string;
  downloadUrl?: string;
  major?: Major;
}

export interface ParentFeedback extends BaseEntity {
  studentId: string;
  title: string;
  content: string;
  status: FeedbackReadStatus;
  reply?: string;
  repliedBy?: string;
  repliedAt?: Date;
}

export interface OperationLog extends BaseEntity {
  staffId: string;
  module: string;
  action: string;
  targetId?: string;
  targetType?: string;
  ip?: string;
  beforeData?: any;
  afterData?: any;
}

export interface ExportTask extends BaseEntity {
  operatorId: string;
  fileName: string;
  module: string;
  filters?: any;
  format: string;
  status: ExportTaskStatus;
  downloadUrl?: string;
  doneAt?: Date;
}

export interface SettingRule extends BaseEntity {
  campusId: string;
  trialFollowUpHours: number;
  renewalHighRiskHours: number;
  renewalMidRiskHours: number;
  feedbackTimeoutHours: number;
}
