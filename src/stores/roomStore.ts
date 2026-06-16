import { create } from 'zustand';
import { api } from '@/api/client';
import type { Room, VacancyStats } from '@/types';

interface RoomState {
  rooms: Room[];
  total: number;
  loading: boolean;
  vacancyStats: VacancyStats[];
  fetchRooms: (params?: Record<string, string | number>) => Promise<void>;
  fetchRoom: (id: number) => Promise<Room>;
  createRoom: (data: Partial<Room>) => Promise<void>;
  updateRoom: (id: number, data: Partial<Room>) => Promise<void>;
  fetchVacancyStats: (days?: number) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  total: 0,
  loading: false,
  vacancyStats: [],

  fetchRooms: async (params) => {
    set({ loading: true });
    try {
      const res = await api.getList<Room>('/rooms', params);
      set({ rooms: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  fetchRoom: async (id) => {
    return api.get<Room>(`/rooms/${id}`);
  },

  createRoom: async (data) => {
    await api.post('/rooms', data);
  },

  updateRoom: async (id, data) => {
    await api.put(`/rooms/${id}`, data);
  },

  fetchVacancyStats: async (days = 30) => {
    const res = await api.get<VacancyStats[]>('/rooms/vacancy-stats', { days });
    set({ vacancyStats: res });
  },
}));
