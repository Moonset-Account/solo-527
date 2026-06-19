import { Role } from '@prisma/client';

export { Role };

export type MemberLevel = 'TRIAL' | 'BASIC' | 'PREMIUM' | 'VIP';
export type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED';
export type CampStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type CourseType = 'VIDEO' | 'AUDIO' | 'PDF' | 'LIVE' | 'HOMEWORK';
export type CheckInStatus = 'PENDING' | 'COMPLETED' | 'LATE' | 'MISSED';
export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TodoType = 'FOLLOW_UP' | 'COURSE_EXPIRE' | 'MEMBER_WARNING' | 'LAGGING_STUDENT' | 'CUSTOM';
export type ConversionChannel = 'WECHAT_GROUP' | 'MOMENTS' | 'FRIEND_REFERRAL' | 'OFFLINE_EVENT' | 'LIVE_STREAM' | 'ADVERTISEMENT' | 'ORGANIC' | 'OTHER';
export type OperationAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CHECK_IN' | 'ASSIGN' | 'COMPLETE' | 'TRANSFER' | 'REMIND' | 'EXPORT' | 'LOGIN' | 'LOGOUT';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const roleLabel: Record<Role, string> = {
  [Role.ADMIN]: '系统管理员',
  [Role.TEACHER]: '课程老师',
  [Role.OPERATOR]: '运营人员',
};

export const memberLevelLabel: Record<MemberLevel, string> = {
  TRIAL: '体验会员',
  BASIC: '基础会员',
  PREMIUM: '高级会员',
  VIP: 'VIP会员',
};

export const memberLevelColor: Record<MemberLevel, string> = {
  TRIAL: 'default',
  BASIC: 'blue',
  PREMIUM: 'purple',
  VIP: 'gold',
};

export const memberStatusLabel: Record<MemberStatus, string> = {
  ACTIVE: '正常',
  EXPIRED: '已过期',
  FROZEN: '已冻结',
  CANCELLED: '已取消',
};

export const memberStatusColor: Record<MemberStatus, string> = {
  ACTIVE: 'success',
  EXPIRED: 'error',
  FROZEN: 'warning',
  CANCELLED: 'default',
};

export const campStatusLabel: Record<CampStatus, string> = {
  UPCOMING: '即将开营',
  ONGOING: '进行中',
  COMPLETED: '已结束',
  CANCELLED: '已取消',
};

export const campStatusColor: Record<CampStatus, string> = {
  UPCOMING: 'geekblue',
  ONGOING: 'green',
  COMPLETED: 'default',
  CANCELLED: 'error',
};

export const courseTypeLabel: Record<CourseType, string> = {
  VIDEO: '视频课',
  AUDIO: '音频课',
  PDF: 'PDF资料',
  LIVE: '直播课',
  HOMEWORK: '作业',
};

export const checkInStatusLabel: Record<CheckInStatus, string> = {
  PENDING: '待打卡',
  COMPLETED: '已完成',
  LATE: '补卡',
  MISSED: '未打卡',
};

export const checkInStatusColor: Record<CheckInStatus, string> = {
  PENDING: 'default',
  COMPLETED: 'success',
  LATE: 'warning',
  MISSED: 'error',
};

export const todoStatusLabel: Record<TodoStatus, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '处理中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export const todoStatusColor: Record<TodoStatus, string> = {
  PENDING: 'warning',
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

export const todoPriorityLabel: Record<TodoPriority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
};

export const todoPriorityColor: Record<TodoPriority, string> = {
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export const todoTypeLabel: Record<TodoType, string> = {
  FOLLOW_UP: '跟进回访',
  COURSE_EXPIRE: '课程过期',
  MEMBER_WARNING: '会员预警',
  LAGGING_STUDENT: '掉队学员',
  CUSTOM: '自定义',
};

export const conversionChannelLabel: Record<ConversionChannel, string> = {
  WECHAT_GROUP: '微信群',
  MOMENTS: '朋友圈',
  FRIEND_REFERRAL: '朋友推荐',
  OFFLINE_EVENT: '线下活动',
  LIVE_STREAM: '直播',
  ADVERTISEMENT: '广告投放',
  ORGANIC: '自然流量',
  OTHER: '其他',
};

export const operationActionLabel: Record<OperationAction, string> = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  CHECK_IN: '打卡',
  ASSIGN: '指派',
  COMPLETE: '完成',
  TRANSFER: '转移',
  REMIND: '提醒',
  EXPORT: '导出',
  LOGIN: '登录',
  LOGOUT: '退出',
};

export interface MemberSummary {
  id: number;
  name: string;
  phone: string;
  childName?: string;
  childAge?: number;
  level: MemberLevel;
  status: MemberStatus;
  totalCheckInDays: number;
  continuousDays: number;
  isLagging: boolean;
  laggingDays: number;
  lastCheckInAt?: string;
  daysUntilExpire: number | null;
}

export interface TodoItem {
  id: number;
  type: TodoType;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string;
  isOverdue?: boolean;
  assignee?: { id: number; name: string; role?: Role };
  member?: MemberSummary;
}
