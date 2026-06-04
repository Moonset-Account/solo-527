import { create } from 'zustand';
import type { Appointment } from '../../shared/types';
import { appointmentApi } from '@/utils/api';

interface AppointmentState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  fetchAppointments: (filters?: { member_id?: number; coach_id?: number; status?: string; date?: string }) => Promise<void>;
  createAppointment: (data: Partial<Appointment>) => Promise<Appointment>;
  updateAppointment: (id: number, data: Partial<Appointment>) => Promise<Appointment>;
  deleteAppointment: (id: number) => Promise<void>;
  checkIn: (id: number) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  loading: false,
  error: null,
  fetchAppointments: async (filters?: { member_id?: number; coach_id?: number; status?: string; date?: string }) => {
    set({ loading: true, error: null });
    try {
      const appointments = await appointmentApi.list(filters);
      set({ appointments, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  createAppointment: async (data: Partial<Appointment>) => {
    const apt = await appointmentApi.create(data);
    set((s) => ({ appointments: [...s.appointments, apt] }));
    return apt;
  },
  updateAppointment: async (id: number, data: Partial<Appointment>) => {
    const apt = await appointmentApi.update(id, data);
    set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? apt : a)) }));
    return apt;
  },
  deleteAppointment: async (id: number) => {
    await appointmentApi.remove(id);
    set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) }));
  },
  checkIn: async (id: number) => {
    const apt = await appointmentApi.checkIn(id);
    set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? apt : a)) }));
  },
}));
