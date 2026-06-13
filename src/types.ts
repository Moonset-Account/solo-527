export type RepairType = 'plumbing' | 'electrical' | 'furniture' | 'door_window' | 'network' | 'other';
export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type RequestStatus = 'pending' | 'identity_verifying' | 'quota_checking' | 'assigned' | 'processing' | 'completed' | 'rejected' | 'waitlisted';
export type StepType = 'identity_review' | 'repair_process' | 'seat_change' | 'status_change' | 'quota_check';
export type UserRole = 'student' | 'dorm_manager' | 'admin';

export interface Student {
  id: string;
  studentNumber: string;
  name: string;
  building: string;
  roomNumber: string;
  phone: string;
  department: string;
}

export interface PhotoInfo {
  id: string;
  requestId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

export interface RepairRequest {
  id: string;
  studentId: string;
  studentName: string;
  building: string;
  roomNumber: string;
  repairType: RepairType;
  description: string;
  urgency: Urgency;
  status: RequestStatus;
  assignedTo: string;
  quotaConfigId: string;
  photos: PhotoInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface FlowRecord {
  id: string;
  requestId: string;
  stepType: StepType;
  previousValue: Record<string, any>;
  newValue: Record<string, any>;
  changedFields: string[];
  operatorId: string;
  operatorName: string;
  remark: string;
  createdAt: string;
}

export interface QuotaConfig {
  id: string;
  building: string;
  repairType: string;
  maxQuota: number;
  currentUsed: number;
  period: string;
  updatedAt: string;
}

export interface CheckInRecord {
  id: string;
  studentId: string;
  studentName: string;
  requestId: string;
  checkInTime: string;
  location: string;
  method: string;
}

export interface StudyRoom {
  id: string;
  name: string;
  building: string;
  totalSeats: number;
}

export interface Seat {
  id: string;
  studyRoomId: string;
  seatNumber: string;
  status: string;
}

export interface SeatAssignment {
  id: string;
  seatId: string;
  studentId: string;
  requestId: string;
  assignedAt: string;
  releasedAt: string | null;
  changeReason: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BatchResult {
  totalCount: number;
  successCount: number;
  failCount: number;
  successIds: string[];
  failures: BatchFailureItem[];
}

export interface BatchFailureItem {
  requestId: string;
  reason: string;
  retryable: boolean;
}

export interface SeatUtilizationDetail {
  studyRoom: string;
  totalSeats: number;
  occupiedSeats: number;
  utilizationRate: number;
  averageDuration: number;
}

export interface IdentityFailureDetail {
  requestId: string;
  studentId: string;
  studentName: string;
  failureReason: string;
  failedAt: string;
  retryCount: number;
}

export interface ProcessingRecordDetail {
  requestId: string;
  repairType: string;
  submittedAt: string;
  completedAt: string | null;
  processingDuration: number | null;
  isOverdue: boolean;
  handler: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
