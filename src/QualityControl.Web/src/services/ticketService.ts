import api from './api'
import type {
  Ticket,
  TicketQuery,
  PagedResult,
  TicketComment,
  ApiResponse
} from '@/types'

export const ticketService = {
  getTickets: (params: TicketQuery): Promise<ApiResponse<PagedResult<Ticket>>> => {
    return api.get('/tickets', { params })
  },

  getTicket: (id: number): Promise<ApiResponse<Ticket>> => {
    return api.get(`/tickets/${id}`)
  },

  createTicket: (data: any): Promise<ApiResponse<Ticket>> => {
    return api.post('/tickets', data)
  },

  updateStatus: (data: any): Promise<ApiResponse<Ticket>> => {
    return api.post('/tickets/status', data)
  },

  addComment: (data: any): Promise<ApiResponse<TicketComment>> => {
    return api.post('/tickets/comment', data)
  },

  getComments: (ticketId: number): Promise<ApiResponse<TicketComment[]>> => {
    return api.get(`/tickets/${ticketId}/comments`)
  },

  getPendingCount: (departmentId?: number): Promise<ApiResponse<number>> => {
    return api.get('/tickets/pending-count', { params: { departmentId } })
  }
}
