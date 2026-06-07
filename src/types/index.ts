export interface Area {
  areaId: string;
  areaName: string;
  floor: number;
  totalSeats: number;
  description: string;
}

export interface Reservation {
  reservationId: string;
  studentId: string;
  studentName: string;
  areaId: string;
  seatId: string;
  startTime: Date;
  endTime: Date;
  status: 'reserved' | 'checked_in' | 'cancelled' | 'no_show';
  createdAt: Date;
}

export interface CheckIn {
  checkinId: string;
  reservationId: string;
  studentId: string;
  checkinTime: Date;
  source: 'seat' | 'gate';
}

export type SeatCheckin = CheckIn;

export interface GateEntry {
  entryId: string;
  studentId: string;
  entryTime: Date;
  gateId: string;
}

export interface Violation {
  violationId: string;
  studentId: string;
  studentName: string;
  reservationId?: string;
  violationType: 'no_show' | 'late_checkin' | 'early_leave' | 'occupancy_timeout';
  occurTime: Date;
  status: 'pending' | 'processed' | 'ignored';
  remark?: string;
  processedBy?: string;
  processedAt?: Date;
}

export interface ClosedDate {
  date: Date;
  reason: string;
}

export interface ExamPeriod {
  startDate: Date;
  endDate: Date;
  name: string;
  noShowThreshold: number;
}

export interface HeatmapCell {
  date: Date;
  hour: number;
  value: number;
  sampleSize: number;
  isClosed?: boolean;
  isExamWeek?: boolean;
}

export interface AreaUtilization {
  areaId: string;
  areaName: string;
  floor: number;
  totalSeats: number;
  utilization: number;
  totalReservations: number;
  peakHours: number[];
  trend: { date: Date; value: number }[];
}

export interface ViolationStats {
  date: Date;
  noShowRate: number;
  totalViolations: number;
  violationByType: Record<string, number>;
  sampleSize: number;
  threshold?: number;
}

export interface DashboardStats {
  todayEntries: number;
  todayReservations: number;
  checkInRate: number;
  noShowRate: number;
  weekTrend: { date: string; entries: number; reservations: number }[];
  topAreas: { areaName: string; utilization: number }[];
}

export interface FilterState {
  dateRange: [Date, Date];
  selectedAreas: string[];
  selectedFloors: number[];
  studentTypes: string[];
  preserveContext: boolean;
}

export interface AuthState {
  userRole: 'super_admin' | 'librarian' | 'student';
  userId: string;
  userName: string;
  permissions: string[];
}

export interface DrillDownData {
  isOpen: boolean;
  title: string;
  dataPoint?: any;
  rawRecords: (Reservation | Violation)[];
  remarks: { id: string; content: string; author: string; time: Date }[];
}

export type UserRole = 'super_admin' | 'librarian' | 'student';
