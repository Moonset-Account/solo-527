import apiClient from './client';
import { DashboardStats } from '../types';

export const dashboardApi = {
  getAdminStats: () => apiClient.get<DashboardStats>('/dashboard/admin'),
  getMentorStats: () => apiClient.get('/dashboard/mentor'),
  getStudentStats: () => apiClient.get('/dashboard/student'),
};
