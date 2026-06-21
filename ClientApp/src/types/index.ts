export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  code: number;
  data?: T;
}

export enum AppointmentStatus {
  Pending = 0,
  Confirmed = 1,
  CheckedIn = 2,
  NoShow = 3,
  Cancelled = 4,
  Completed = 5,
}

export enum UserRole {
  Client = 0,
  Counselor = 1,
  Receptionist = 2,
  Manager = 3,
  Admin = 4,
}

export enum ServiceStatus {
  Active = 0,
  Inactive = 1,
  Discontinued = 2,
}

export enum RefundStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Completed = 3,
}

export enum ReminderType {
  AppointmentReminder = 0,
  NoShowAlert = 1,
  RefundStatusUpdate = 2,
  WaitlistUpdate = 3,
  StoreClosure = 4,
}

export enum CheckInMethod {
  Manual = 0,
  QRCode = 1,
  SelfService = 2,
  StaffAssisted = 3,
}

export enum PrivacyLevel {
  Public = 0,
  Internal = 1,
  Confidential = 2,
  Restricted = 3,
}

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  privacyLevel: PrivacyLevel;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceItemDto {
  id: number;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  status: ServiceStatus;
  privacyLevel: PrivacyLevel;
}

export interface CounselorDto {
  id: number;
  userId: number;
  fullName: string;
  title: string;
  specialties: string;
  bio?: string;
  maxDailyAppointments: number;
  serviceItems?: ServiceItemDto[];
}

export interface AppointmentDto {
  id: number;
  appointmentNo: string;
  clientId: number;
  clientName: string;
  clientPhone: string;
  counselorId: number;
  counselorName: string;
  serviceItemId: number;
  serviceItemName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string;
  price: number;
  isFromWaitlist: boolean;
  createdAt: string;
  checkInRecord?: CheckInRecordDto;
  refundRecord?: RefundRecordDto;
  noShowRecord?: NoShowRecordDto;
}

export interface CheckInRecordDto {
  id: number;
  appointmentId: number;
  checkInTime: string;
  checkInMethod: CheckInMethod;
  checkedInBy?: string;
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  remarks?: string;
}

export interface NoShowRecordDto {
  id: number;
  appointmentId: number;
  recordedAt: string;
  recordedBy?: string;
  reason: string;
  isWaived: boolean;
  waivedReason?: string;
  waivedBy?: string;
}

export interface RefundRecordDto {
  id: number;
  appointmentId: number;
  appointmentNo: string;
  clientName: string;
  amount: number;
  status: RefundStatus;
  reason: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  completedAt?: string;
  transactionId?: string;
  createdAt: string;
}

export interface WaitlistItemDto {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  serviceItemId: number;
  serviceItemName: string;
  preferredCounselorId?: number;
  preferredCounselorName?: string;
  preferredDate: string;
  reason: string;
  isActive: boolean;
  priority: number;
  notified: boolean;
  notifiedAt?: string;
  createdAt: string;
}

export interface ReminderDto {
  id: number;
  appointmentId?: number;
  userId: number;
  type: ReminderType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  scheduledAt: string;
  isSent: boolean;
  sentAt?: string;
  createdAt: string;
}

export interface StoreClosureDto {
  id: number;
  closureDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  isFullDay: boolean;
  affectedCounselors?: string;
  createdBy: string;
  createdAt: string;
}

export interface StatisticsDailyDto {
  date: string;
  totalAppointments: number;
  checkedInCount: number;
  noShowCount: number;
  cancelledCount: number;
  attendanceRate: number;
  revenue: number;
  newClients: number;
  refundCount: number;
  refundAmount: number;
}

export interface CrossDepartmentReportDto {
  startDate: string;
  endDate: string;
  overallAttendanceRate: number;
  totalAppointments: number;
  totalCompleted: number;
  totalCheckedIn: number;
  totalNoShow: number;
  totalCancelled: number;
  storeClosures: StoreClosureDto[];
  recentProcessedRecords: AppointmentDto[];
  dailyStatistics: StatisticsDailyDto[];
  refundRecords: RefundRecordDto[];
  serviceItems: ServiceItemDto[];
  waitlistReminders: WaitlistReminderDto[];
  serviceItemStats: ServiceItemStatsDto[];
  refundSummary: RefundSummaryDto;
  totalRevenue: number;
  totalRefundAmount: number;
}

export interface ServiceItemStatsDto {
  serviceItemId: number;
  serviceItemName: string;
  appointmentCount: number;
  completedCount: number;
  revenue: number;
  waitlistCount: number;
}

export interface RefundSummaryDto {
  totalRefundCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  totalAmount: number;
  completedAmount: number;
}

export interface WaitlistReminderDto {
  id: number;
  clientId: number;
  clientName: string;
  serviceItemId: number;
  serviceItemName: string;
  reason: string;
  priority: number;
  notified: boolean;
  createdAt: string;
  isActive: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}
