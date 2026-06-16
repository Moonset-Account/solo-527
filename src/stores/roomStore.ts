import { create } from 'zustand';
import { api } from '@/api/client';
import type { Room } from '@/types';

interface RoomState {
  rooms: Room[];
  total: number;
  loading: boolean;
  currentRoom: Room | null;
  detailLoading: boolean;
  error: string | null;
  fetchRooms: (params?: Record<string, string | number>) => Promise<void>;
  fetchRoom: (id: number) => Promise<void>;
  createRoom: (data: Partial<Room>) => Promise<boolean>;
  updateRoom: (id: number, data: Partial<Room>) => Promise<boolean>;
  clearCurrentRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  total: 0,
  loading: false,
  currentRoom: null,
  detailLoading: false,
  error: null,

  fetchRooms: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getList<Room>('/rooms', params);
      set({ rooms: res.data, total: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取房源列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchRoom: async (id) => {
    set({ detailLoading: true, error: null, currentRoom: null });
    try {
      const res = await api.get<Room>(`/rooms/${id}`);
      set({ currentRoom: res });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取房源详情失败' });
    } finally {
      set({ detailLoading: false });
    }
  },

  createRoom: async (data) => {
    set({ error: null });
    try {
      await api.post('/rooms', data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建房源失败' });
      return false;
    }
  },

  updateRoom: async (id, data) => {
    set({ error: null });
    try {
      await api.put(`/rooms/${id}`, data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新房源失败' });
      return false;
    }
  },

  clearCurrentRoom: () => {
    set({ currentRoom: null });
  },
}));
