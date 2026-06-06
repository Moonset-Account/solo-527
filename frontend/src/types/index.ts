export interface User {
  id: number
  username: string
  realName: string
  phone?: string
  email?: string
  role: UserRole
  status: string
}

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'COACH'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  username: string
  realName: string
  role: UserRole
  userId: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface Member {
  id: number
  memberNo: string
  name: string
  phone: string
  gender?: string
  birthday?: string
  address?: string
  status: string
  source?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface Coach {
  id: number
  userId: number
  coachNo: string
  specialty?: string
  description?: string
  hireDate?: string
  user?: User
}

export interface PackageType {
  id: number
  name: string
  type: 'PRIVATE' | 'GROUP'
  totalSessions: number
  price: number
  duration?: number
  description?: string
  status: string
}

export interface MemberPackage {
  id: number
  memberId: number
  packageTypeId: number
  coachId?: number
  purchaseDate: string
  expireDate?: string
  totalSessions: number
  remainingSessions: number
  usedSessions: number
  freezeDays: number
  status: string
  remark?: string
  member?: Member
  packageType?: PackageType
  coach?: Coach
}

export interface GroupClass {
  id: number
  classNo: string
  name: string
  coachId: number
  classDate: string
  startTime: string
  endTime: string
  capacity: number
  registeredCount: number
  location?: string
  description?: string
  status: string
  coach?: Coach
}

export type BookingType = 'PRIVATE' | 'GROUP'
export type BookingStatus = 'BOOKED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface Booking {
  id: number
  bookingNo: string
  memberId: number
  memberPackageId?: number
  coachId?: number
  groupClassId?: number
  bookingType: BookingType
  bookingDate: string
  startTime: string
  endTime: string
  status: BookingStatus
  checkInTime?: string
  checkOutTime?: string
  remark?: string
  member?: Member
  memberPackage?: MemberPackage
  coach?: Coach
  groupClass?: GroupClass
}

export interface MemberFreeze {
  id: number
  freezeNo: string
  memberId: number
  memberPackageId?: number
  freezeType: string
  startDate: string
  endDate: string
  freezeDays: number
  reason?: string
  status: string
  member?: Member
  memberPackage?: MemberPackage
}

export interface BodyMeasurement {
  id: number
  memberId: number
  measureDate: string
  height?: number
  weight?: number
  bmi?: number
  bodyFat?: number
  muscleMass?: number
  waist?: number
  hip?: number
  chest?: number
  armLeft?: number
  armRight?: number
  thighLeft?: number
  thighRight?: number
  remark?: string
  attachmentUrl?: string
  member?: Member
}

export interface Notification {
  id: number
  notificationNo: string
  userId?: number
  memberId?: number
  type: string
  title: string
  content?: string
  isRead: boolean
  readAt?: string
  createdBy?: string
  createdAt: string
}

export interface AuditLog {
  id: number
  logNo: string
  userId?: number
  username?: string
  operation: string
  module: string
  targetId?: number
  targetType?: string
  oldValue?: string
  newValue?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface DashboardStats {
  newMemberCount: number
  totalActiveMembers: number
  totalBookings: number
  completedBookings: number
  pendingBookings: number
  cancelledBookings: number
  privateBookings: number
  groupBookings: number
  totalGroupClasses: number
  classUtilizationRate: string
  expiringPackagesCount: number
  lowSessionPackagesCount: number
  coachId?: number
  dateRange: {
    start: string
    end: string
  }
  generatedAt: string
}

export interface CoachPerformance {
  coachId: number
  privateSessionCount: number
  groupClassCount: number
  totalMembers: number
  dateRange: {
    start: string
    end: string
  }
}

export interface FunnelItem {
  stage: string
  count: number
  color: string
}
