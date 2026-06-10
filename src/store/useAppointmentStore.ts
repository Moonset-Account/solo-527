import { create } from 'zustand';
import {
  appointmentApi,
  AppointmentDto,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentListRequest,
  PagedResult
} from '@/services/api';

interface AppointmentState {
  appointments: AppointmentDto[];
  currentAppointment: AppointmentDto | null;
  pagedResult: PagedResult<AppointmentDto> | null;
  loading: boolean;
  error: string | null;

  fetchAppointments: (params?: AppointmentListRequest) => Promise<void>;
  fetchAppointment: (id: string) => Promise<void>;
  createAppointment: (data: CreateAppointmentRequest) => Promise<AppointmentDto>;
  updateAppointment: (id: string, data: UpdateAppointmentRequest) => Promise<AppointmentDto>;
  deleteAppointment: (id: string) => Promise<void>;
  setCurrentAppointment: (appointment: AppointmentDto | null) => void;
  clearError: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  currentAppointment: null,
  pagedResult: null,
  loading: false,
  error: null,

  fetchAppointments: async (params) => {
    set({ loading: true, error: null });
    try {
      const result = await appointmentApi.getAppointments(params);
      set({ appointments: result.items, pagedResult: result, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取预约列表失败', loading: false });
    }
  },

  fetchAppointment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const appointment = await appointmentApi.getAppointment(id);
      set({ currentAppointment: appointment, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取预约详情失败', loading: false });
    }
  },

  createAppointment: async (data: CreateAppointmentRequest) => {
    set({ loading: true, error: null });
    try {
      const newAppointment = await appointmentApi.createAppointment(data);
      const { appointments } = get();
      set({ appointments: [newAppointment, ...appointments], loading: false });
      return newAppointment;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建预约失败', loading: false });
      throw err;
    }
  },

  updateAppointment: async (id: string, data: UpdateAppointmentRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = await appointmentApi.updateAppointment(id, data);
      const { appointments, currentAppointment } = get();
      set({
        appointments: appointments.map(a => a.id === id ? updated : a),
        currentAppointment: currentAppointment?.id === id ? updated : currentAppointment,
        loading: false
      });
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新预约失败', loading: false });
      throw err;
    }
  },

  deleteAppointment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await appointmentApi.deleteAppointment(id);
      const { appointments, currentAppointment } = get();
      set({
        appointments: appointments.filter(a => a.id !== id),
        currentAppointment: currentAppointment?.id === id ? null : currentAppointment,
        loading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除预约失败', loading: false });
      throw err;
    }
  },

  setCurrentAppointment: (appointment) => {
    set({ currentAppointment: appointment });
  },

  clearError: () => {
    set({ error: null });
  }
}));
