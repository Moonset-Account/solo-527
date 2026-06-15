import { create } from 'zustand';
import { api } from '@/lib/api';

interface ConfigItem {
  id: number;
  assetId: number;
  key: string;
  value: string;
  environment: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ConfigItemQuery {
  page?: number;
  limit?: number;
  assetId?: number;
  keyword?: string;
}

interface ConfigItemState {
  items: ConfigItem[];
  total: number;
  loading: boolean;
  fetchConfigItems: (query?: ConfigItemQuery) => Promise<void>;
  createConfigItem: (data: Partial<ConfigItem>) => Promise<ConfigItem>;
  updateConfigItem: (id: number, data: Partial<ConfigItem>) => Promise<void>;
  deleteConfigItem: (id: number) => Promise<void>;
}

export const useConfigItemStore = create<ConfigItemState>((set) => ({
  items: [],
  total: 0,
  loading: false,

  fetchConfigItems: async (query?: ConfigItemQuery) => {
    set({ loading: true });
    try {
      const params: Record<string, string | number | undefined> = {
        page: query?.page || 1,
        limit: query?.limit || 20,
        assetId: query?.assetId,
        keyword: query?.keyword,
      };
      const res = await api.get<{ items: ConfigItem[]; total: number }>('/config-items', params);
      set({ items: res.items, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createConfigItem: async (data) => {
    const item = await api.post<ConfigItem>('/config-items', data);
    return item;
  },

  updateConfigItem: async (id, data) => {
    await api.put(`/config-items/${id}`, data);
  },

  deleteConfigItem: async (id) => {
    await api.delete(`/config-items/${id}`);
  },
}));
