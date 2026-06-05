import apiClient from './client';
import { Feedback, FeedbackQuestion } from '../types';

export const feedbackApi = {
  getQuestions: (targetRole: string = 'student') => 
    apiClient.get<FeedbackQuestion[]>('/feedback/questions', { params: { target_role: targetRole } }),
  get: (appointmentId: number) => 
    apiClient.get<Feedback>(`/appointments/${appointmentId}/feedback`),
  submitStudent: (appointmentId: number, data: any) => 
    apiClient.post(`/appointments/${appointmentId}/feedback/student`, data),
  submitMentor: (appointmentId: number, data: any) => 
    apiClient.post(`/appointments/${appointmentId}/feedback/mentor`, data),
};
