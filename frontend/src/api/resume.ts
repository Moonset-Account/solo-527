import api, { ApiResponse, PaginatedResponse } from '../utils/api';

export interface Resume {
  id: string;
  candidateId: string;
  candidateName: string;
  email?: string;
  phone?: string;
  school?: string;
  major?: string;
  degree?: string;
  graduationYear?: number;
  skills?: string;
  experience?: string;
  projects?: string;
  positionApplied?: string;
  status: string;
  overallScore: number;
  abilityProfile?: string;
  assignedHrId?: string;
  recruiterCycle?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeSubmitParams {
  candidateName: string;
  email?: string;
  phone?: string;
  school?: string;
  major?: string;
  degree?: string;
  graduationYear?: number;
  skills?: string;
  experience?: string;
  projects?: string;
  positionApplied?: string;
  recruiterCycle?: string;
}

export const resumeApi = {
  submit: (data: ResumeSubmitParams): Promise<ApiResponse<Resume>> =>
    api.post('/resumes/submit', data),

  getResumes: (params?: {
    status?: string;
    positionApplied?: string;
    recruiterCycle?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<Resume>>> =>
    api.get('/resumes', { params }),

  getMyResumes: (): Promise<ApiResponse<Resume[]>> =>
    api.get('/resumes/my'),

  getResumeById: (id: string): Promise<ApiResponse<Resume>> =>
    api.get(`/resumes/${id}`),

  updateStatus: (id: string, status: string, reason?: string): Promise<ApiResponse<Resume>> =>
    api.put(`/resumes/${id}/status`, { status, reason }),

  updateResume: (id: string, data: any): Promise<ApiResponse<Resume>> =>
    api.put(`/resumes/${id}`, data),

  getStatusLogs: (id: string): Promise<ApiResponse<any[]>> =>
    api.get(`/resumes/${id}/logs`),

  getProcessingRecords: (id: string): Promise<ApiResponse<any[]>> =>
    api.get(`/resumes/${id}/records`),

  getStats: (): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    todayNew: number;
  }>> =>
    api.get('/resumes/stats'),
};
