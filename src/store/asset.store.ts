import { create } from 'zustand';
import { api } from '@/lib/api';

interface Asset {
  id: number;
  assetCode: string;
  name: string;
  type: string;
  status: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

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

interface AssetDetail extends Asset {
  configItems: ConfigItem[];
  tickets: { id: number; title: string; status: string }[];
}

interface AssetQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  keyword?: string;
}

interface AssetState {
  assets: Asset[];
  total: number;
  currentAsset: AssetDetail | null;
  loading: boolean;
  fetchAssets: (query?: AssetQuery) => Promise<void>;
  fetchAsset: (id: number) => Promise<void>;
  createAsset: (data: Partial<Asset>) => Promise<Asset>;
  updateAsset: (id: number, data: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
}

export const useAssetStore = create<AssetState>((set) => ({
  assets: [],
  total: 0,
  currentAsset: null,
  loading: false,

  fetchAssets: async (query?: AssetQuery) => {
    set({ loading: true });
    try {
      const params: Record<string, string | number | undefined> = {
        page: query?.page || 1,
        limit: query?.limit || 10,
        type: query?.type,
        status: query?.status,
        keyword: query?.keyword,
      };
      const res = await api.get<{ items: Asset[]; total: number }>('/assets', params);
      set({ assets: res.items, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchAsset: async (id: number) => {
    set({ loading: true });
    try {
      const asset = await api.get<AssetDetail>(`/assets/${id}`);
      set({ currentAsset: asset, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createAsset: async (data) => {
    const asset = await api.post<Asset>('/assets', data);
    return asset;
  },

  updateAsset: async (id, data) => {
    await api.put(`/assets/${id}`, data);
  },

  deleteAsset: async (id) => {
    await api.delete(`/assets/${id}`);
  },
}));
