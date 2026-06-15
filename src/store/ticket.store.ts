import { create } from 'zustand';
import { api } from '@/lib/api';

interface Ticket {
  id: number;
  title: string;
  type: string;
  priority: string;
  status: string;
  description: string;
  creatorId: number;
  creatorName: string;
  assigneeId: number | null;
  assigneeName: string | null;
  assetIds: number[];
  createdAt: string;
  updatedAt: string;
}

interface TimelineEvent {
  id: number;
  ticketId: number;
  eventType: string;
  title: string;
  description: string;
  operatorId: number;
  operatorName: string;
  result: string;
  createdAt: string;
}

interface SlaDetail {
  id: number;
  ticketId: number;
  stage: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMinutes: number | null;
  isOverdue: boolean;
}

interface TicketDetail extends Ticket {
  timeline: TimelineEvent[];
  slaDetails: SlaDetail[];
}

interface TicketQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  keyword?: string;
}

interface TicketState {
  tickets: Ticket[];
  total: number;
  currentTicket: TicketDetail | null;
  loading: boolean;
  fetchTickets: (query?: TicketQuery) => Promise<void>;
  fetchTicket: (id: number) => Promise<void>;
  createTicket: (data: Partial<Ticket> & { assetIds?: number[] }) => Promise<Ticket>;
  updateTicket: (id: number, data: Partial<Ticket>) => Promise<void>;
  assignTicket: (id: number, assigneeId: number) => Promise<void>;
  approveTicket: (id: number) => Promise<void>;
  rejectTicket: (id: number, comment: string) => Promise<void>;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  total: 0,
  currentTicket: null,
  loading: false,

  fetchTickets: async (query?: TicketQuery) => {
    set({ loading: true });
    try {
      const params: Record<string, string | number | undefined> = {
        page: query?.page || 1,
        limit: query?.limit || 10,
        type: query?.type,
        status: query?.status,
        keyword: query?.keyword,
      };
      const res = await api.get<{ items: Ticket[]; total: number }>('/tickets', params);
      set({ tickets: res.items, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTicket: async (id: number) => {
    set({ loading: true });
    try {
      const ticket = await api.get<TicketDetail>(`/tickets/${id}`);
      set({ currentTicket: ticket, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createTicket: async (data) => {
    const ticket = await api.post<Ticket>('/tickets', data);
    return ticket;
  },

  updateTicket: async (id, data) => {
    await api.put(`/tickets/${id}`, data);
  },

  assignTicket: async (id, assigneeId) => {
    await api.patch(`/tickets/${id}/assign`, { assigneeId });
  },

  approveTicket: async (id) => {
    await api.patch(`/tickets/${id}/approve`);
  },

  rejectTicket: async (id, comment) => {
    await api.patch(`/tickets/${id}/reject`, { comment });
  },
}));
