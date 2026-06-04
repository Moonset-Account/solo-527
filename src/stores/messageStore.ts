import { create } from 'zustand';
import type { Message } from '../../shared/types';
import { messageApi } from '@/utils/api';

interface MessageState {
  messages: Message[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchMessages: (filters?: { read?: boolean; page?: number; limit?: number }) => Promise<void>;
  markRead: (id: number) => Promise<void>;
  sendMessage: (data: { userId: number; title: string; content: string; type?: string }) => Promise<Message>;
  fetchUnreadCount: () => Promise<void>;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null,
  fetchMessages: async (filters?: { read?: boolean; page?: number; limit?: number }) => {
    set({ loading: true, error: null });
    try {
      const messages = await messageApi.list(filters);
      set({ messages, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  markRead: async (id: number) => {
    await messageApi.markRead(id);
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },
  sendMessage: async (data: { userId: number; title: string; content: string; type?: string }) => {
    return await messageApi.send(data);
  },
  fetchUnreadCount: async () => {
    try {
      const data = await messageApi.getUnreadCount();
      set({ unreadCount: data.count });
    } catch {
      // silent
    }
  },
}));
