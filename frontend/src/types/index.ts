export type UserRole = 'Student' | 'Teacher' | 'Admin' | 'Principal' | 'AdmissionAdvisor';

export interface User {
  id: number;
  userName: string;
  realName: string;
  phone: string;
  email: string;
  role: UserRole;
  remainingHours?: number;
  totalHours?: number;
  artMajor?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ClassDto {
  id: number;
  name: string;
  description?: string;
  courseId: number;
  courseName: string;
  teacherId?: number;
  teacherName?: string;
  maxStudents: number;
  studentCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export type ScheduleStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface ScheduleDto {
  id: number;
  classId: number;
  className: string;
  teacherName?: string;
  startTime: string;
  endTime: string;
  classroom?: string;
  status: ScheduleStatus;
  durationHours: number;
  notes?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave' | 'NotMarked';

export interface AttendanceDto {
  id: number;
  scheduleId: number;
  studentId: number;
  studentName: string;
  status: AttendanceStatus;
  hoursDeducted: boolean;
  notes?: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRecordDto {
  id: number;
  studentId: number;
  studentName: string;
  scheduleId: number;
  scheduleStartTime: string;
  className: string;
  reason: string;
  status: LeaveStatus;
  hoursDeducted: boolean;
  createdAt: string;
}

export interface WorkFeedbackDto {
  id: number;
  scheduleId: number;
  className: string;
  scheduleDate: string;
  studentId: number;
  studentName: string;
  teacherId: number;
  teacherName: string;
  workTitle: string;
  workImageUrl?: string;
  feedback: string;
  score: number;
  suggestions?: string;
  parentNotified: boolean;
  createdAt: string;
}

export type FeedbackType =
  | 'StudyProgress'
  | 'Behavior'
  | 'Attendance'
  | 'WorkQuality'
  | 'ExamResult'
  | 'Communication'
  | 'Other';

export interface HomeSchoolFeedbackDto {
  id: number;
  studentId: number;
  studentName: string;
  createdById: number;
  createdByName: string;
  type: FeedbackType;
  content: string;
  isReminder: boolean;
  reminderDate?: string;
  parentRead: boolean;
  createdAt: string;
}

export interface NotificationDto {
  id: number;
  type: string;
  fromUserId?: number;
  fromUserName?: string;
  title: string;
  content: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdAt: string;
}

export interface OperationLogDto {
  id: number;
  operationType: string;
  operatorId: number;
  operatorName: string;
  entityType: string;
  entityId?: number;
  beforeData?: string;
  afterData?: string;
  changeDescription: string;
  createdAt: string;
}

export interface BatchFailedItem {
  itemId: number;
  itemName: string;
  errorMessage: string;
  itemData?: any;
}

export interface BatchOperationDto {
  id: string;
  operationType: string;
  operatorId: number;
  operatorName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  failedItemsList?: BatchFailedItem[];
  summary?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface HoursWarningDto {
  id: number;
  studentId: number;
  studentName: string;
  remainingHours: number;
  thresholdHours: number;
  notifiedAdvisor: boolean;
  advisorName?: string;
  notifiedAt?: string;
  resolved: boolean;
}

export interface MonthlyReportDto {
  id: number;
  year: number;
  month: number;
  studentId?: number;
  studentName?: string;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  leaveClasses: number;
  totalHoursUsed: number;
  feedbackCount: number;
  averageScore: number;
  feedbacks?: HomeSchoolFeedbackDto[];
  notes?: string;
}

export const FeedbackTypeMap: Record<FeedbackType, string> = {
  StudyProgress: '学习进度',
  Behavior: '行为表现',
  Attendance: '考勤情况',
  WorkQuality: '作品质量',
  ExamResult: '考试成绩',
  Communication: '沟通交流',
  Other: '其他'
};

export const AttendanceStatusMap: Record<AttendanceStatus, string> = {
  Present: '出勤',
  Absent: '缺勤',
  Late: '迟到',
  Leave: '请假',
  NotMarked: '未标记'
};

export const LeaveStatusMap: Record<LeaveStatus, string> = {
  Pending: '待审批',
  Approved: '已批准',
  Rejected: '已拒绝',
  Cancelled: '已取消'
};

export const ScheduleStatusMap: Record<ScheduleStatus, string> = {
  Scheduled: '已安排',
  Completed: '已完成',
  Cancelled: '已取消',
  Rescheduled: '已调课'
};

export const UserRoleMap: Record<UserRole, string> = {
  Student: '学生',
  Teacher: '教师',
  Admin: '教务',
  Principal: '校长',
  AdmissionAdvisor: '招生顾问'
};
