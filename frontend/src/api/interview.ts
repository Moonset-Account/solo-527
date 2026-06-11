import api, { ApiResponse, PaginatedResponse } from '../utils/api';

export interface Interview {
  id: string;
  resumeId: string;
  candidateName: string;
  position: string;
  interviewerId?: string;
  interviewerName?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  status: string;
  location?: string;
  meetingLink?: string;
  interviewType?: string;
  round?: number;
  feedback?: string;
  score?: number;
  abilityAssessment?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const interviewApi = {
  createInterview: (data: any): Promise<ApiResponse<Interview>> =>
    api.post('/interviews', data),

  getInterviews: (params?: {
    interviewerId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<Interview>>> =>
    api.get('/interviews', { params }),

  getMyInterviews: (): Promise<ApiResponse<Interview[]>> =>
    api.get('/interviews/my'),

  getInterviewById: (id: string): Promise<ApiResponse<Interview>> =>
    api.get(`/interviews/${id}`),

  updateInterview: (id: string, data: any): Promise<ApiResponse<Interview>> =>
    api.put(`/interviews/${id}`, data),

  completeInterview: (id: string, data: any): Promise<ApiResponse<Interview>> =>
    api.put(`/interviews/${id}/complete`, data),

  getInterviewerSchedule: (interviewerId: string, date: string): Promise<ApiResponse<any>> =>
    api.get(`/interviews/schedules/${interviewerId}/${date}`),

  createOrUpdateSchedule: (data: any): Promise<ApiResponse<any>> =>
    api.post('/interviews/schedules', data),

  getQualityStats: (): Promise<ApiResponse<{
    total: number;
    completed: number;
    avgScore: number;
    scoreDistribution: Record<string, number>;
  }>> =>
    api.get('/interviews/quality-stats'),
};
