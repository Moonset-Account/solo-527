import request from '@/utils/request';
import { Interview, SearchParams, PaginatedResult, InterviewStatus, Assessment } from '@/types';

export interface CreateInterviewParams {
  candidateName: string;
  candidatePhone: string;
  candidateEmail?: string;
  position?: string;
  level?: string;
  skills?: string[];
  interviewerId: string;
  scheduleId: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  channel?: string;
  remark?: string;
  resumeUrl?: string;
}

export interface QuickCreateParams {
  candidateName: string;
  candidatePhone: string;
  position?: string;
  interviewerId: string;
  interviewDate: string;
  timeSlot: string;
}

export interface UpdateStatusParams {
  status: InterviewStatus;
  remark?: string;
}

export const getInterviews = (params?: SearchParams): Promise<PaginatedResult<Interview>> => {
  return request.get('/interviews', { params });
};

export const getInterviewById = (id: string): Promise<Interview> => {
  return request.get(`/interviews/${id}`);
};

export const getTodayInterviews = (interviewerId?: string): Promise<Interview[]> => {
  return request.get('/interviews/today', { params: { interviewerId } });
};

export const getInterviewStats = (startDate?: string, endDate?: string): Promise<any> => {
  return request.get('/interviews/statistics', { params: { startDate, endDate } });
};

export const createInterview = (data: CreateInterviewParams): Promise<Interview> => {
  return request.post('/interviews', data);
};

export const quickCreateInterview = (data: QuickCreateParams): Promise<Interview> => {
  return request.post('/interviews/quick', data);
};

export const updateInterview = (id: string, data: Partial<CreateInterviewParams>): Promise<Interview> => {
  return request.patch(`/interviews/${id}`, data);
};

export const updateInterviewStatus = (id: string, data: UpdateStatusParams): Promise<Interview> => {
  return request.patch(`/interviews/${id}/status`, data);
};

export const checkIn = (id: string): Promise<Interview> => {
  return request.post(`/interviews/${id}/checkin`);
};

export const cancelInterview = (id: string, reason?: string): Promise<Interview> => {
  return request.post(`/interviews/${id}/cancel`, { reason });
};

export const getInterview = getInterviewById;
export const quickCreate = quickCreateInterview;
export const updateStatus = updateInterviewStatus;
export const cancel = cancelInterview;

export const getInterviewAssessments = (interviewId: string): Promise<PaginatedResult<Assessment>> => {
  return request.get(`/assessments`, { params: { interviewId } });
};
