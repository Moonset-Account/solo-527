import { create } from 'zustand';
import api from '@/api';
import type { Inventory, CalendarData, InventoryConflict, SpecialPricing } from '@/types';

interface InventoryState {
  calendarData: CalendarData;
  inventoryList: Inventory[];
  conflicts: InventoryConflict[];
  specialPricing: SpecialPricing[];
  isLoading: boolean;
  error: string | null;

  fetchCalendar: (params: {
    property_id: string;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
  fetchInventory: (params?: Record<string, unknown>) => Promise<void>;
  fetchConflicts: (params?: Record<string, unknown>) => Promise<void>;
  fetchSpecialPricing: (params?: Record<string, unknown>) => Promise<void>;
  batchUpdate: (data: {
    room_ids: string[];
    start_date: string;
    end_date: string;
    status?: string;
    price?: number;
  }) => Promise<void>;
  checkAvailability: (params: {
    room_id: string;
    check_in_date: string;
    check_out_date: string;
  }) => Promise<{ available: boolean; total_price: number }>;
  createSpecialPricing: (data: Partial<SpecialPricing>) => Promise<void>;
  updateSpecialPricing: (id: string, data: Partial<SpecialPricing>) => Promise<void>;
  deleteSpecialPricing: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  calendarData: {},
  inventoryList: [],
  conflicts: [],
  specialPricing: [],
  isLoading: false,
  error: null,

  fetchCalendar: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.inventory.getCalendar(params);
      set({ calendarData: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取日历数据失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchInventory: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.inventory.list(params);
      set({ inventoryList: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取房态数据失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchConflicts: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.inventory.conflicts(params);
      set({ conflicts: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取房态冲突失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchSpecialPricing: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.inventory.specialPricing.list(params);
      set({ specialPricing: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取特殊价格失败';
      set({ error: message, isLoading: false });
    }
  },

  batchUpdate: async (data) => {
    set({ isLoading: true });
    try {
      await api.inventory.batchUpdate(data);
      set({ isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '批量更新房态失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  checkAvailability: async (params) => {
    try {
      const response = await api.inventory.checkAvailability(params);
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '检查可用性失败';
      set({ error: message });
      throw error;
    }
  },

  createSpecialPricing: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.inventory.specialPricing.create(data);
      set((state) => ({
        specialPricing: [...state.specialPricing, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '创建特殊价格失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateSpecialPricing: async (id: string, data) => {
    set({ isLoading: true });
    try {
      const response = await api.inventory.specialPricing.update(id, data);
      const specialPricing = get().specialPricing.map((sp) =>
        sp.id === id ? response.data : sp
      );
      set({ specialPricing, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新特殊价格失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteSpecialPricing: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.inventory.specialPricing.delete(id);
      const specialPricing = get().specialPricing.filter((sp) => sp.id !== id);
      set({ specialPricing, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除特殊价格失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
