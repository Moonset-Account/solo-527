import request from '@/utils/request';
import type {
  Ticket,
  TicketDetail,
  TicketNote,
  TicketFilterParams,
  CreateTicketData,
  UpdateTicketData,
  PaginatedResponse,
  ApiResponse,
  DashboardStats,
} from '@/types';

export const ticketApi = {
  getTickets: async (params?: TicketFilterParams): Promise<ApiResponse<PaginatedResponse<Ticket>>> => {
    return request.get('/tickets', { params });
  },

  getTicket: async (id: string): Promise<ApiResponse<TicketDetail>> => {
    return request.get(`/tickets/${id}`);
  },

  createTicket: async (data: CreateTicketData): Promise<ApiResponse<Ticket>> => {
    return request.post('/tickets', data);
  },

  updateTicket: async (id: string, data: UpdateTicketData): Promise<ApiResponse<Ticket>> => {
    return request.put(`/tickets/${id}`, data);
  },

  assignTicket: async (id: string, assigneeId: string): Promise<ApiResponse<Ticket>> => {
    return request.post(`/tickets/${id}/assign`, { assigneeId });
  },

  escalateTicket: async (id: string, reason: string, level: number = 2): Promise<ApiResponse<Ticket>> => {
    return request.post(`/tickets/${id}/escalate`, { reason, level });
  },

  resolveTicket: async (id: string, resolution: string): Promise<ApiResponse<Ticket>> => {
    return request.post(`/tickets/${id}/resolve`, { resolution });
  },

  addNote: async (ticketId: string, content: string, isInternal: boolean = false): Promise<ApiResponse<TicketNote>> => {
    return request.post(`/tickets/${ticketId}/notes`, { content, isInternal });
  },

  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return request.get('/tickets/dashboard/stats');
  },
};
