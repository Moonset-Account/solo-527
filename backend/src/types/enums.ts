export const Role = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  OPERATOR: 'OPERATOR',
} as const;
export type Role = typeof Role[keyof typeof Role];

export const MemberLevel = {
  TRIAL: 'TRIAL',
  BASIC: 'BASIC',
  PREMIUM: 'PREMIUM',
  VIP: 'VIP',
} as const;
export type MemberLevel = typeof MemberLevel[keyof typeof MemberLevel];

export const MemberStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  FROZEN: 'FROZEN',
  CANCELLED: 'CANCELLED',
} as const;
export type MemberStatus = typeof MemberStatus[keyof typeof MemberStatus];

export const CampStatus = {
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type CampStatus = typeof CampStatus[keyof typeof CampStatus];

export const CourseType = {
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  PDF: 'PDF',
  LIVE: 'LIVE',
  HOMEWORK: 'HOMEWORK',
} as const;
export type CourseType = typeof CourseType[keyof typeof CourseType];

export const CheckInStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  LATE: 'LATE',
  MISSED: 'MISSED',
} as const;
export type CheckInStatus = typeof CheckInStatus[keyof typeof CheckInStatus];

export const TodoStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TodoStatus = typeof TodoStatus[keyof typeof TodoStatus];

export const TodoPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TodoPriority = typeof TodoPriority[keyof typeof TodoPriority];

export const TodoType = {
  FOLLOW_UP: 'FOLLOW_UP',
  COURSE_EXPIRE: 'COURSE_EXPIRE',
  MEMBER_WARNING: 'MEMBER_WARNING',
  LAGGING_STUDENT: 'LAGGING_STUDENT',
  CUSTOM: 'CUSTOM',
} as const;
export type TodoType = typeof TodoType[keyof typeof TodoType];

export const ConversionChannel = {
  WECHAT_GROUP: 'WECHAT_GROUP',
  MOMENTS: 'MOMENTS',
  FRIEND_REFERRAL: 'FRIEND_REFERRAL',
  OFFLINE_EVENT: 'OFFLINE_EVENT',
  LIVE_STREAM: 'LIVE_STREAM',
  ADVERTISEMENT: 'ADVERTISEMENT',
  ORGANIC: 'ORGANIC',
  OTHER: 'OTHER',
} as const;
export type ConversionChannel = typeof ConversionChannel[keyof typeof ConversionChannel];

export const OperationAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  CHECK_IN: 'CHECK_IN',
  ASSIGN: 'ASSIGN',
  COMPLETE: 'COMPLETE',
  TRANSFER: 'TRANSFER',
  REMIND: 'REMIND',
  EXPORT: 'EXPORT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  RESOLVE: 'RESOLVE',
  FOLLOW_UP: 'FOLLOW_UP',
} as const;
export type OperationAction = typeof OperationAction[keyof typeof OperationAction];
