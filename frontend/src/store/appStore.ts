import { create } from 'zustand';
import api from '@/api';
import type { Property, Room, TourRoute, CleaningTask, ItineraryVersion, AuditLog } from '@/types';

interface AppState {
  properties: Property[];
  rooms: Room[];
  tourRoutes: TourRoute[];
  cleaningTasks: CleaningTask[];
  itineraryVersions: ItineraryVersion[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  error: string | null;

  fetchProperties: (params?: Record<string, unknown>) => Promise<void>;
  fetchRooms: (params?: Record<string, unknown>) => Promise<void>;
  fetchTourRoutes: (params?: Record<string, unknown>) => Promise<void>;
  fetchCleaningTasks: (params?: Record<string, unknown>) => Promise<void>;
  fetchItineraryVersions: (params?: Record<string, unknown>) => Promise<void>;
  fetchAuditLogs: (params?: Record<string, unknown>) => Promise<void>;

  createProperty: (data: Partial<Property>) => Promise<void>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  createRoom: (data: Partial<Room>) => Promise<void>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  createTourRoute: (data: Partial<TourRoute>) => Promise<void>;
  updateTourRoute: (id: string, data: Partial<TourRoute>) => Promise<void>;
  deleteTourRoute: (id: string) => Promise<void>;

  createCleaningTask: (data: Partial<CleaningTask>) => Promise<void>;
  updateCleaningTask: (id: string, data: Partial<CleaningTask>) => Promise<void>;
  deleteCleaningTask: (id: string) => Promise<void>;

  createItineraryVersion: (data: Partial<ItineraryVersion>) => Promise<void>;
  updateItineraryVersion: (id: string, data: Partial<ItineraryVersion>) => Promise<void>;
  deleteItineraryVersion: (id: string) => Promise<void>;
  compareItineraryVersions: (id1: string, id2: string) => Promise<Array<{
    field: string;
    old_value: unknown;
    new_value: unknown;
  }>>;
}

export const useAppStore = create<AppState>((set, get) => ({
  properties: [],
  rooms: [],
  tourRoutes: [],
  cleaningTasks: [],
  itineraryVersions: [],
  auditLogs: [],
  isLoading: false,
  error: null,

  fetchProperties: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.properties.list(params);
      set({ properties: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取民宿列表失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchRooms: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.rooms.list(params);
      set({ rooms: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取房型列表失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchTourRoutes: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.tourRoutes.list(params);
      set({ tourRoutes: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取导览路线失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchCleaningTasks: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.cleaningTasks.list(params);
      set({ cleaningTasks: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取清洁任务失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchItineraryVersions: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.itineraryVersions.list(params);
      set({ itineraryVersions: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取行程版本失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchAuditLogs: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.audit.logs(params);
      set({ auditLogs: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取审计日志失败';
      set({ error: message, isLoading: false });
    }
  },

  createProperty: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.properties.create(data);
      set((state) => ({
        properties: [...state.properties, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '创建民宿失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateProperty: async (id: string, data) => {
    set({ isLoading: true });
    try {
      const response = await api.properties.update(id, data);
      const properties = get().properties.map((p) => (p.id === id ? response.data : p));
      set({ properties, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新民宿失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteProperty: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.properties.delete(id);
      const properties = get().properties.filter((p) => p.id !== id);
      set({ properties, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除民宿失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createRoom: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.rooms.create(data);
      set((state) => ({
        rooms: [...state.rooms, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '创建房型失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateRoom: async (id: string, data) => {
    set({ isLoading: true });
    try {
      const response = await api.rooms.update(id, data);
      const rooms = get().rooms.map((r) => (r.id === id ? response.data : r));
      set({ rooms, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新房型失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteRoom: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.rooms.delete(id);
      const rooms = get().rooms.filter((r) => r.id !== id);
      set({ rooms, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除房型失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createTourRoute: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.tourRoutes.create(data);
      set((state) => ({
        tourRoutes: [...state.tourRoutes, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '创建导览路线失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTourRoute: async (id: string, data) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.tourRoutes.update(id, data);
      const tourRoutes = get().tourRoutes.map((r) => (r.id === id ? response.data : r));
      set({ tourRoutes, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新导览路线失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteTourRoute: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.configuration.tourRoutes.delete(id);
      const tourRoutes = get().tourRoutes.filter((r) => r.id !== id);
      set({ tourRoutes, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除导览路线失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createCleaningTask: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.cleaningTasks.create(data);
      set((state) => ({
        cleaningTasks: [...state.cleaningTasks, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '创建清洁任务失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateCleaningTask: async (id: string, data) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.cleaningTasks.update(id, data);
      const cleaningTasks = get().cleaningTasks.map((t) => (t.id === id ? response.data : t));
      set({ cleaningTasks, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新清洁任务失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteCleaningTask: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.configuration.cleaningTasks.delete(id);
      const cleaningTasks = get().cleaningTasks.filter((t) => t.id !== id);
      set({ cleaningTasks, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除清洁任务失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createItineraryVersion: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.itineraryVersions.create(data);
      set((state) => ({
        itineraryVersions: [...state.itineraryVersions, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '创建行程版本失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateItineraryVersion: async (id: string, data) => {
    set({ isLoading: true });
    try {
      const response = await api.configuration.itineraryVersions.update(id, data);
      const itineraryVersions = get().itineraryVersions.map((v) => (v.id === id ? response.data : v));
      set({ itineraryVersions, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新行程版本失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteItineraryVersion: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.configuration.itineraryVersions.delete(id);
      const itineraryVersions = get().itineraryVersions.filter((v) => v.id !== id);
      set({ itineraryVersions, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除行程版本失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  compareItineraryVersions: async (id1: string, id2: string) => {
    try {
      const response = await api.configuration.itineraryVersions.compare(id1, id2);
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '比较行程版本失败';
      set({ error: message });
      throw error;
    }
  },
}));
