import { create } from 'zustand';
import { api } from '@/api/client';
import type { Appointment, PaginatedResponse } from '@/types';

interface AppointmentState {
  appointments: Appointment[];
  total: number;
  loading: boolean;
  calendarAppointments: Appointment[];
  calendarLoading: boolean;
  createLoading: boolean;
  error: string | null;
  fetchAppointments: (params?: Record<string, string | number>) => Promise<void>;
  createAppointment: (data: Partial<Appointment>) => Promise<boolean>;
  updateStatus: (id: number, status: string) => Promise<void>;
  fetchCalendar: (month: string) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  total: 0,
  loading: false,
  calendarAppointments: [],
  calendarLoading: false,
  createLoading: false,
  error: null,

  fetchAppointments: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getList<Appointment>('/appointments', params);
      set({ appointments: res.data, total: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取预约列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  createAppointment: async (data) => {
    set({ createLoading: true, error: null });
    try {
      await api.post('/appointments', data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建预约失败' });
      return false;
    } finally {
      set({ createLoading: false });
    }
  },

  updateStatus: async (id, status) => {
    set({ error: null });
    try {
      await api.put(`/appointments/${id}/status`, { status });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新状态失败' });
      throw err;
    }
  },

  fetchCalendar: async (month) => {
    set({ calendarLoading: true, error: null });
    try {
      const res = await api.get<Appointment[]>('/appointments/calendar', { month });
      set({ calendarAppointments: res });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取日历数据失败' });
    } finally {
      set({ calendarLoading: false });
    }
  },
}));
