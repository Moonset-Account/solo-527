import { create } from 'zustand';
import { api } from '@/api/client';
import type { MessageRecord } from '@/types';

interface MessageState {
  messages: MessageRecord[];
  total: number;
  loading: boolean;
  retryLoading: number | null;
  error: string | null;
  fetchMessages: (params?: Record<string, string | number>) => Promise<void>;
  retryMessage: (id: number) => Promise<boolean>;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  total: 0,
  loading: false,
  retryLoading: null,
  error: null,

  fetchMessages: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getList<MessageRecord>('/messages', params);
      set({ messages: res.data, total: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取消息列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  retryMessage: async (id) => {
    set({ retryLoading: id, error: null });
    try {
      await api.post(`/messages/${id}/retry`);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '重试失败' });
      return false;
    } finally {
      set({ retryLoading: null });
    }
  },
}));
