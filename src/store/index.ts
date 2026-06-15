import { create } from 'zustand';
import type {
  Doctor,
  TimeSlot,
  ServiceItem,
  Schedule,
  Appointment,
  AppointmentHistory,
  Closure,
  AuditLog,
  ExportRecord,
  DashboardStats,
  AppointmentStatus,
} from '../../shared/types';

const today = new Date().toISOString().split('T')[0];

const mockDoctors: Doctor[] = [
  { id: 'd1', name: '张医生', title: '主治医师', department: '洁牙科', isActive: true },
  { id: 'd2', name: '李医生', title: '副主任医师', department: '洁牙科', isActive: true },
  { id: 'd3', name: '王技师', title: '洁牙技师', department: '洁牙科', isActive: true },
  { id: 'd4', name: '赵医生', title: '住院医师', department: '牙周科', isActive: true },
  { id: 'd5', name: '刘技师', title: '洁牙技师', department: '洁牙科', isActive: false },
];

const mockTimeSlots: TimeSlot[] = [
  { id: 'ts1', startTime: '08:00', endTime: '08:30', label: '08:00-08:30' },
  { id: 'ts2', startTime: '08:30', endTime: '09:00', label: '08:30-09:00' },
  { id: 'ts3', startTime: '09:00', endTime: '09:30', label: '09:00-09:30' },
  { id: 'ts4', startTime: '09:30', endTime: '10:00', label: '09:30-10:00' },
  { id: 'ts5', startTime: '10:00', endTime: '10:30', label: '10:00-10:30' },
  { id: 'ts6', startTime: '10:30', endTime: '11:00', label: '10:30-11:00' },
  { id: 'ts7', startTime: '14:00', endTime: '14:30', label: '14:00-14:30' },
  { id: 'ts8', startTime: '14:30', endTime: '15:00', label: '14:30-15:00' },
  { id: 'ts9', startTime: '15:00', endTime: '15:30', label: '15:00-15:30' },
  { id: 'ts10', startTime: '15:30', endTime: '16:00', label: '15:30-16:00' },
];

const mockServices: ServiceItem[] = [
  { id: 's1', name: '普通洁牙', category: '洁牙', duration: 30, price: 200 },
  { id: 's2', name: '深度洁牙', category: '洁牙', duration: 45, price: 400 },
  { id: 's3', name: '喷砂洁牙', category: '洁牙', duration: 40, price: 350 },
  { id: 's4', name: '牙周刮治', category: '牙周', duration: 60, price: 600 },
  { id: 's5', name: '儿童洁牙', category: '洁牙', duration: 20, price: 150 },
];

function getDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

const mockSchedules: Schedule[] = [
  { id: 'sc1', doctorId: 'd1', date: today, timeSlotId: 'ts1', shiftType: 'morning', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'sc2', doctorId: 'd1', date: today, timeSlotId: 'ts2', shiftType: 'morning', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'sc3', doctorId: 'd2', date: today, timeSlotId: 'ts3', shiftType: 'morning', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'sc4', doctorId: 'd3', date: today, timeSlotId: 'ts7', shiftType: 'afternoon', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'sc5', doctorId: 'd4', date: today, timeSlotId: 'ts1', shiftType: 'morning', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'sc6', doctorId: 'd1', date: getDateStr(1), timeSlotId: 'ts3', shiftType: 'morning', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'sc7', doctorId: 'd2', date: getDateStr(1), timeSlotId: 'ts7', shiftType: 'afternoon', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'sc8', doctorId: 'd3', date: getDateStr(2), timeSlotId: 'ts1', shiftType: 'morning', createdBy: 'admin', createdAt: today, updatedAt: today },
];

const mockAppointments: Appointment[] = [
  { id: 'a1', patientName: '张三', patientPhone: '13800138001', doctorId: 'd1', scheduleId: 'sc1', date: today, timeSlotId: 'ts1', serviceId: 's1', status: 'arrived', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'a2', patientName: '李四', patientPhone: '13800138002', doctorId: 'd1', scheduleId: 'sc2', date: today, timeSlotId: 'ts2', serviceId: 's2', status: 'confirmed', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'a3', patientName: '王五', patientPhone: '13800138003', doctorId: 'd2', scheduleId: 'sc3', date: today, timeSlotId: 'ts3', serviceId: 's1', status: 'pending', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'a4', patientName: '赵六', patientPhone: '13800138004', doctorId: 'd3', scheduleId: 'sc4', date: today, timeSlotId: 'ts7', serviceId: 's3', status: 'no_show', noShowReason: '电话无法接通', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'a5', patientName: '孙七', patientPhone: '13800138005', doctorId: 'd4', scheduleId: 'sc5', date: today, timeSlotId: 'ts1', serviceId: 's4', status: 'completed', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'a6', patientName: '周八', patientPhone: '13800138006', doctorId: 'd1', scheduleId: 'sc6', date: getDateStr(1), timeSlotId: 'ts3', serviceId: 's1', status: 'pending', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'a7', patientName: '吴九', patientPhone: '13800138007', doctorId: 'd2', scheduleId: 'sc7', date: getDateStr(1), timeSlotId: 'ts7', serviceId: 's5', status: 'confirmed', createdBy: 'admin', createdAt: today, updatedAt: today },
  { id: 'a8', patientName: '郑十', patientPhone: '13800138008', doctorId: 'd1', scheduleId: 'sc1', date: getDateStr(-1), timeSlotId: 'ts1', serviceId: 's2', status: 'completed', createdBy: 'admin', createdAt: getDateStr(-1), updatedAt: getDateStr(-1) },
  { id: 'a9', patientName: '陈一一', patientPhone: '13800138009', doctorId: 'd2', scheduleId: 'sc3', date: getDateStr(-1), timeSlotId: 'ts3', serviceId: 's1', status: 'no_show', noShowReason: '忘记预约', createdBy: 'admin', createdAt: getDateStr(-1), updatedAt: getDateStr(-1) },
  { id: 'a10', patientName: '林二二', patientPhone: '13800138010', doctorId: 'd3', scheduleId: 'sc4', date: getDateStr(-2), timeSlotId: 'ts7', serviceId: 's3', status: 'cancelled', createdBy: 'admin', createdAt: getDateStr(-2), updatedAt: getDateStr(-2) },
];

const mockAppointmentHistories: AppointmentHistory[] = [
  { id: 'ah1', appointmentId: 'a1', fromStatus: 'pending', toStatus: 'confirmed', changedBy: 'admin', changedAt: today, remark: '电话确认' },
  { id: 'ah2', appointmentId: 'a1', fromStatus: 'confirmed', toStatus: 'arrived', changedBy: 'admin', changedAt: today },
  { id: 'ah3', appointmentId: 'a5', fromStatus: 'pending', toStatus: 'confirmed', changedBy: 'admin', changedAt: today },
  { id: 'ah4', appointmentId: 'a5', fromStatus: 'confirmed', toStatus: 'arrived', changedBy: 'admin', changedAt: today },
  { id: 'ah5', appointmentId: 'a5', fromStatus: 'arrived', toStatus: 'completed', changedBy: 'admin', changedAt: today },
  { id: 'ah6', appointmentId: 'a4', fromStatus: 'confirmed', toStatus: 'no_show', changedBy: 'admin', changedAt: today, remark: '电话无法接通，超过预约时间30分钟' },
];

const mockClosures: Closure[] = [
  { id: 'cl1', date: getDateStr(3), reason: '设备维修', createdBy: 'admin', createdAt: today },
  { id: 'cl2', date: getDateStr(7), startTime: '14:00', endTime: '17:00', reason: '员工培训', createdBy: 'admin', createdAt: today },
];

const mockAuditLogs: AuditLog[] = [
  { id: 'al1', action: '创建排班', module: '排班管理', operatorId: 'admin', operatorName: '管理员', targetId: 'sc1', targetType: 'schedule', detail: '为张医生创建排班', ipAddress: '192.168.1.1', createdAt: `${today}T08:00:00` },
  { id: 'al2', action: '创建预约', module: '预约管理', operatorId: 'admin', operatorName: '管理员', targetId: 'a1', targetType: 'appointment', detail: '为患者张三创建预约', ipAddress: '192.168.1.1', createdAt: `${today}T08:15:00` },
  { id: 'al3', action: '变更状态', module: '预约管理', operatorId: 'admin', operatorName: '管理员', targetId: 'a1', targetType: 'appointment', detail: '将预约状态从confirmed变更为arrived', ipAddress: '192.168.1.2', createdAt: `${today}T09:00:00` },
  { id: 'al4', action: '标记爽约', module: '预约管理', operatorId: 'admin', operatorName: '管理员', targetId: 'a4', targetType: 'appointment', detail: '标记患者赵六爽约', ipAddress: '192.168.1.1', createdAt: `${today}T10:30:00` },
  { id: 'al5', action: '创建关店', module: '排班管理', operatorId: 'admin', operatorName: '管理员', targetId: 'cl1', targetType: 'closure', detail: '创建临时关店: 设备维修', ipAddress: '192.168.1.3', createdAt: `${today}T11:00:00` },
  { id: 'al6', action: '数据导出', module: '数据导出', operatorId: 'admin', operatorName: '管理员', targetId: 'er1', targetType: 'export', detail: '导出本周预约数据', ipAddress: '192.168.1.1', createdAt: `${today}T14:00:00` },
  { id: 'al7', action: '删除排班', module: '排班管理', operatorId: 'admin', operatorName: '管理员', targetId: 'sc8', targetType: 'schedule', detail: '删除刘技师排班', ipAddress: '192.168.1.2', createdAt: `${today}T15:00:00` },
];

const mockExportRecords: ExportRecord[] = [
  { id: 'er1', operatorId: 'admin', operatorName: '管理员', filterCriteria: { dateRange: '2024-01-01~2024-01-31', doctors: ['d1', 'd2'] }, arrivalRate: 0.85, closureCount: 2, lastChangeAt: `${today}T14:00:00`, fileUrl: '/exports/jan-2024.csv', generatedAt: `${today}T14:00:00` },
  { id: 'er2', operatorId: 'admin', operatorName: '管理员', filterCriteria: { dateRange: '2024-02-01~2024-02-29', status: ['completed', 'no_show'] }, arrivalRate: 0.78, closureCount: 1, lastChangeAt: `${getDateStr(-1)}T16:00:00`, fileUrl: '/exports/feb-2024.csv', generatedAt: `${getDateStr(-1)}T16:00:00` },
];

const mockDashboardStats: DashboardStats = {
  totalSchedulesToday: 5,
  totalAppointmentsToday: 5,
  arrivedCount: 1,
  completedCount: 1,
  noShowCount: 1,
  arrivalRate: 0.6,
  closureCount: 0,
  lastChangeAt: `${today}T10:30:00`,
};

interface StoreState {
  doctors: Doctor[];
  timeSlots: TimeSlot[];
  services: ServiceItem[];
  schedules: Schedule[];
  appointments: Appointment[];
  appointmentHistories: AppointmentHistory[];
  closures: Closure[];
  auditLogs: AuditLog[];
  exportRecords: ExportRecord[];
  dashboardStats: DashboardStats;
  currentOperator: { id: string; name: string };
  loading: boolean;
  error: string | null;

  fetchDoctors: () => Promise<void>;
  fetchTimeSlots: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchSchedules: (filters?: Record<string, string>) => Promise<void>;
  createSchedule: (data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSchedule: (id: string, data: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  batchCreateSchedules: (data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  fetchAppointments: (filters?: Record<string, string>) => Promise<void>;
  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus, remark?: string) => Promise<void>;
  markNoShow: (id: string, reason: string) => Promise<void>;
  fetchClosures: () => Promise<void>;
  createClosure: (data: Omit<Closure, 'id' | 'createdAt'>) => Promise<void>;
  fetchAuditLogs: (filters?: Record<string, string>) => Promise<void>;
  fetchExportRecords: () => Promise<void>;
  createExport: (filters: Record<string, unknown>) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  doctors: mockDoctors,
  timeSlots: mockTimeSlots,
  services: mockServices,
  schedules: mockSchedules,
  appointments: mockAppointments,
  appointmentHistories: mockAppointmentHistories,
  closures: mockClosures,
  auditLogs: mockAuditLogs,
  exportRecords: mockExportRecords,
  dashboardStats: mockDashboardStats,
  currentOperator: { id: 'admin', name: '管理员' },
  loading: false,
  error: null,

  fetchDoctors: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        set({ doctors: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchTimeSlots: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/time-slots');
      if (res.ok) {
        const data = await res.json();
        set({ timeSlots: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchServices: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        set({ services: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchSchedules: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
      const res = await fetch(`/api/schedules${params}`);
      if (res.ok) {
        const data = await res.json();
        set({ schedules: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  createSchedule: async (data) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newSchedule = await res.json();
        set((state) => ({ schedules: [...state.schedules, newSchedule], loading: false }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  updateSchedule: async (id, data) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          schedules: state.schedules.map((s) => (s.id === id ? { ...s, ...updated } : s)),
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  deleteSchedule: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  batchCreateSchedules: async (data) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/schedules/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newSchedules = await res.json();
        set((state) => ({ schedules: [...state.schedules, ...newSchedules], loading: false }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchAppointments: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
      const res = await fetch(`/api/appointments${params}`);
      if (res.ok) {
        const data = await res.json();
        set({ appointments: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  createAppointment: async (data) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newAppt = await res.json();
        set((state) => ({ appointments: [...state.appointments, newAppt], loading: false }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  updateAppointmentStatus: async (id, status, remark) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remark }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        const oldAppt = get().appointments.find((a) => a.id === id);
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status, updatedAt: now } : a
          ),
          appointmentHistories: oldAppt
            ? [
                ...state.appointmentHistories,
                {
                  id: `ah_${Date.now()}`,
                  appointmentId: id,
                  fromStatus: oldAppt.status,
                  toStatus: status,
                  changedBy: state.currentOperator.id,
                  changedAt: now,
                  remark,
                },
              ]
            : state.appointmentHistories,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  markNoShow: async (id, reason) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/appointments/${id}/no-show`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        const oldAppt = get().appointments.find((a) => a.id === id);
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status: 'no_show' as AppointmentStatus, noShowReason: reason, updatedAt: now } : a
          ),
          appointmentHistories: oldAppt
            ? [
                ...state.appointmentHistories,
                {
                  id: `ah_${Date.now()}`,
                  appointmentId: id,
                  fromStatus: oldAppt.status,
                  toStatus: 'no_show' as AppointmentStatus,
                  changedBy: state.currentOperator.id,
                  changedAt: now,
                  remark: reason,
                },
              ]
            : state.appointmentHistories,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchClosures: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/closures');
      if (res.ok) {
        const data = await res.json();
        set({ closures: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  createClosure: async (data) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newClosure = await res.json();
        set((state) => ({ closures: [...state.closures, newClosure], loading: false }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchAuditLogs: async (filters?: Record<string, string>) => {
    set({ loading: true });
    try {
      const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
      const res = await fetch(`/api/audit-logs${params}`);
      if (res.ok) {
        const data = await res.json();
        set({ auditLogs: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchExportRecords: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/exports');
      if (res.ok) {
        const data = await res.json();
        set({ exportRecords: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  createExport: async (filters) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      if (res.ok) {
        const newRecord = await res.json();
        set((state) => ({ exportRecords: [newRecord, ...state.exportRecords], loading: false }));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchDashboardStats: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        set({ dashboardStats: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },
}));
