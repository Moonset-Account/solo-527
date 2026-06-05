import apiClient from './client';
import { Mentor, TimeSlot, MatchRecommendation, PaginatedResponse, Feedback } from '../types';

export const mentorsApi = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<Mentor>>('/mentors', { params }),
  get: (id: number) => apiClient.get<Mentor>(`/mentors/${id}`),
  update: (id: number, data: any) => apiClient.put(`/mentors/${id}`, data),
  review: (id: number, status: string) => 
    apiClient.post(`/mentors/${id}/review`, { status }),
  getTimeSlots: (mentorId: number, params?: any) => 
    apiClient.get<TimeSlot[]>(`/mentors/${mentorId}/time-slots`, { params }),
  addTimeSlot: (mentorId: number, data: any) => 
    apiClient.post(`/mentors/${mentorId}/time-slots`, data),
  deleteTimeSlot: (slotId: number) => apiClient.delete(`/time-slots/${slotId}`),
  getRecommendations: (limit = 10) => 
    apiClient.get<MatchRecommendation[]>(`/mentors/recommendations?limit=${limit}`),
  getFeedbacks: (mentorId: number, params?: any) => 
    apiClient.get<PaginatedResponse<Feedback>>(`/mentors/${mentorId}/feedbacks`, { params }),
};
