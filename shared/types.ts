export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  avatar?: string;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

export type ShiftType = "morning" | "afternoon" | "full_day";

export interface Schedule {
  id: string;
  doctorId: string;
  date: string;
  timeSlotId: string;
  shiftType: ShiftType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "completed"
  | "no_show"
  | "cancelled";

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  scheduleId: string;
  date: string;
  timeSlotId: string;
  serviceId: string;
  status: AppointmentStatus;
  noShowReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentHistory {
  id: string;
  appointmentId: string;
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  changedBy: string;
  changedAt: string;
  remark?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
}

export interface Closure {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  relatedType: "schedule" | "appointment" | "closure";
  relatedId: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Note {
  id: string;
  content: string;
  relatedType: "schedule" | "appointment" | "closure";
  relatedId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  operatorId: string;
  operatorName: string;
  targetId: string;
  targetType: string;
  detail: string;
  ipAddress: string;
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  filterCriteria: Record<string, unknown>;
  arrivalRate: number;
  closureCount: number;
  lastChangeAt: string;
  fileUrl: string;
  generatedAt: string;
}

export interface DashboardStats {
  totalSchedulesToday: number;
  totalAppointmentsToday: number;
  arrivedCount: number;
  completedCount: number;
  noShowCount: number;
  arrivalRate: number;
  closureCount: number;
  lastChangeAt: string;
}

export interface ReviewStats {
  totalAppointments: number;
  arrivedCount: number;
  completedCount: number;
  noShowCount: number;
  arrivalRate: number;
  noShowRate: number;
  noShowReasons: { reason: string; count: number }[];
  serviceDistribution: { serviceId: string; serviceName: string; count: number }[];
}
