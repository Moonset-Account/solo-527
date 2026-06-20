import request from '@/utils/request';
import { Schedule, SearchParams, PaginatedResult, ScheduleStatus } from '@/types';

export interface CreateScheduleParams {
  interviewerId: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: ScheduleStatus;
  location?: string;
  notes?: string;
}

export interface CreateScheduleBatchParams {
  interviewerId: string;
  startDate: string;
  endDate: string;
  timeSlots: string[];
  weekdays?: number[];
}

export const getSchedules = (params?: SearchParams): Promise<PaginatedResult<Schedule>> => {
  return request.get('/interviewers/schedules', { params });
};

export const getAvailableSchedules = (interviewerId?: string, date?: string): Promise<Schedule[]> => {
  return request.get('/interviewers/schedules/available', { params: { interviewerId, date } });
};

export const getScheduleById = (id: string): Promise<Schedule> => {
  return request.get(`/interviewers/schedules/${id}`);
};

export const createSchedule = (data: CreateScheduleParams): Promise<Schedule> => {
  return request.post('/interviewers/schedules', data);
};

export const createScheduleBatch = (data: CreateScheduleBatchParams): Promise<Schedule[]> => {
  return request.post('/interviewers/schedules/batch', data);
};

export const updateSchedule = (id: string, data: Partial<CreateScheduleParams>): Promise<Schedule> => {
  return request.patch(`/interviewers/schedules/${id}`, data);
};

export const deleteSchedule = (id: string): Promise<Schedule> => {
  return request.delete(`/interviewers/schedules/${id}`);
};

export const getInterviewerStats = (id: string): Promise<any> => {
  return request.get(`/interviewers/${id}/stats`);
};
