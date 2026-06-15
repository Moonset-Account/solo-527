import api from './api'
import type {
  Session,
  SessionQuery,
  PagedResult,
  SessionStatistics,
  ApiResponse,
  SessionMessage
} from '@/types'

export const sessionService = {
  getSessions: (params: SessionQuery): Promise<ApiResponse<PagedResult<Session>>> => {
    return api.get('/sessions', { params })
  },

  getSession: (id: number): Promise<ApiResponse<Session>> => {
    return api.get(`/sessions/${id}`)
  },

  createSession: (data: any): Promise<ApiResponse<Session>> => {
    return api.post('/sessions', data)
  },

  addMessage: (data: any): Promise<ApiResponse<Session>> => {
    return api.post('/sessions/message', data)
  },

  getStatistics: (agentId?: number, departmentId?: number): Promise<ApiResponse<SessionStatistics>> => {
    return api.get('/sessions/statistics', { params: { agentId, departmentId } })
  },

  getRandomForInspection: (data: any): Promise<ApiResponse<Session[]>> => {
    return api.post('/sessions/random-inspection', data)
  },

  exportSessions: (data: any): Promise<Blob> => {
    return api.post('/sessions/export', data, { responseType: 'blob' })
  }
}
