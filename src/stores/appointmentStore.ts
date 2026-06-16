import { create } from 'zustand';
import { api } from '@/api/client';
import type { Appointment } from '@/types';

interface AppointmentState {
  appointments: Appointment[];
  total: number;
  loading: boolean;
  fetchAppointments: (params?: Record<string, string | number>) => Promise<void>;
  createAppointment: (data: Partial<Appointment>) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  fetchCalendar: (month: string) => Promise<Appointment[]>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  total: 0,
  loading: false,

  fetchAppointments: async (params) => {
    set({ loading: true });
    try {
      const res = await api.getList<Appointment>('/appointments', params);
      set({ appointments: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  createAppointment: async (data) => {
    await api.post('/appointments', data);
  },

  updateStatus: async (id, status) => {
    await api.put(`/appointments/${id}/status`, { status });
  },

  fetchCalendar: async (month) => {
    const res = await api.get<Appointment[]>('/appointments/calendar', { month });
    return res;
  },
}));
