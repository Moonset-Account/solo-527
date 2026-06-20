export enum Role {
  ADMIN = 'admin',
  INTERVIEWER = 'interviewer',
  HR = 'hr',
}

export enum InterviewStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum HireResult {
  PENDING = 'pending',
  PASS = 'pass',
  FAIL = 'fail',
  HOLD = 'hold',
}

export enum ReminderType {
  INFO = 'info',
  WARNING = 'warning',
  BLOCKING = 'blocking',
}

export enum ReminderTrigger {
  TIME_BEFORE_INTERVIEW = 'time_before_interview',
  DAILY_SCHEDULE = 'daily_schedule',
  NO_CHECKIN = 'no_checkin',
  NO_ASSESSMENT = 'no_assessment',
  INTERVIEWER_QUOTA = 'interviewer_quota',
}

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  CODING = 'coding',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

export enum ScheduleStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  UNAVAILABLE = 'unavailable',
}

export interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  department?: string;
  position?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface Interview {
  _id: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail?: string;
  position?: string;
  level?: string;
  skills?: string[];
  interviewerId: User;
  scheduleId: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  channel?: string;
  status: InterviewStatus;
  hireResult: HireResult;
  checkInTime?: string;
  startInterviewTime?: string;
  endInterviewTime?: string;
  createdBy?: User;
  remark?: string;
  resumeUrl?: string;
  assessment?: Assessment;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  _id: string;
  interviewerId: User;
  date: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  interviewId?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  _id: string;
  interviewId: Interview;
  interviewerId: User;
  dimensions?: {
    dimension: string;
    score: number;
    weight: number;
    comment?: string;
  }[];
  totalScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  overallComment?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation: HireResult;
  suggestedLevel?: string;
  suggestedSalary?: string;
  usedQuestions?: any[];
  isFinal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id: string;
  title: string;
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  category: string;
  tags: string[];
  referenceAnswer?: string;
  analysis?: string;
  options?: string[];
  correctAnswers?: number[];
  createdBy?: User;
  isActive: boolean;
  usedCount: number;
  correctRate: number;
  defaultScore: number;
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  _id: string;
  userId: string;
  type: ReminderType;
  title: string;
  content: string;
  metadata?: {
    module?: string;
    recordId?: string;
    relatedData?: any;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ReminderConfig {
  _id: string;
  name: string;
  trigger: string;
  type: ReminderType;
  config: {
    timeThresholdMinutes?: number;
    dailyTime?: string;
    checkInGraceMinutes?: number;
    assessmentDeadlineHours?: number;
    quotaWarningPercentage?: number;
    blocking?: boolean;
  };
  targetRoles: string[];
  enabled: boolean;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  _id: string;
  userId: User;
  operationType: string;
  module: string;
  targetId?: string;
  details?: any;
  ip?: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  status?: string;
  ownerId?: string;
  keyword?: string;
  statuses?: string[];
  interviewerId?: string;
  interviewId?: string;
  type?: string;
  types?: string[];
}

export const ReminderTriggerLabel: Record<ReminderTrigger, string> = {
  [ReminderTrigger.TIME_BEFORE_INTERVIEW]: '面试前提醒',
  [ReminderTrigger.DAILY_SCHEDULE]: '每日日程',
  [ReminderTrigger.NO_CHECKIN]: '未签到',
  [ReminderTrigger.NO_ASSESSMENT]: '未测评',
  [ReminderTrigger.INTERVIEWER_QUOTA]: '讲师档期不足',
};

export const InterviewStatusLabel: Record<InterviewStatus, string> = {
  [InterviewStatus.PENDING]: '待处理',
  [InterviewStatus.SCHEDULED]: '已预约',
  [InterviewStatus.CONFIRMED]: '已确认',
  [InterviewStatus.CHECKED_IN]: '已签到',
  [InterviewStatus.IN_PROGRESS]: '进行中',
  [InterviewStatus.COMPLETED]: '已完成',
  [InterviewStatus.CANCELLED]: '已取消',
  [InterviewStatus.NO_SHOW]: '未到场',
};

export const HireResultLabel: Record<HireResult, string> = {
  [HireResult.PENDING]: '待评定',
  [HireResult.PASS]: '通过',
  [HireResult.FAIL]: '不通过',
  [HireResult.HOLD]: '待定',
};

export const ReminderTypeLabel: Record<ReminderType, string> = {
  [ReminderType.INFO]: '普通提示',
  [ReminderType.WARNING]: '警告',
  [ReminderType.BLOCKING]: '阻断告警',
};

export const ScheduleStatusLabel: Record<ScheduleStatus, string> = {
  [ScheduleStatus.AVAILABLE]: '可预约',
  [ScheduleStatus.BOOKED]: '已预约',
  [ScheduleStatus.UNAVAILABLE]: '不可用',
};

export const QuestionTypeLabel: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: '单选题',
  [QuestionType.MULTIPLE_CHOICE]: '多选题',
  [QuestionType.TRUE_FALSE]: '判断题',
  [QuestionType.SHORT_ANSWER]: '简答题',
  [QuestionType.ESSAY]: '论述题',
  [QuestionType.CODING]: '编程题',
};

export const DifficultyLevelLabel: Record<DifficultyLevel, string> = {
  [DifficultyLevel.EASY]: '简单',
  [DifficultyLevel.MEDIUM]: '中等',
  [DifficultyLevel.HARD]: '困难',
  [DifficultyLevel.EXPERT]: '专家',
};

export const RoleLabel: Record<Role, string> = {
  [Role.ADMIN]: '管理员',
  [Role.INTERVIEWER]: '面试官',
  [Role.HR]: 'HR',
};
