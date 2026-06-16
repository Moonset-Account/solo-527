import { create } from 'zustand';
import { api } from '@/api/client';
import type { MessageRecord } from '@/types';

interface MessageState {
  messages: MessageRecord[];
  total: number;
  loading: boolean;
  retryLoading: number | null;
  fetchMessages: (params?: Record<string, string | number>) => Promise<void>;
  retryMessage: (id: number) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  total: 0,
  loading: false,
  retryLoading: null,

  fetchMessages: async (params) => {
    set({ loading: true });
    try {
      const res = await api.getList<MessageRecord>('/messages', params);
      set({ messages: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  retryMessage: async (id) => {
    set({ retryLoading: id });
    try {
      await api.post(`/messages/${id}/retry`);
    } finally {
      set({ retryLoading: null });
    }
  },
}));
