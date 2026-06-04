import api from './api';

export const profitService = {
  getDashboardStats: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/profit/stats', { params }),

  getMonthlyStats: (params?: {
    year?: number;
    month?: number;
  }) => api.get('/profit/monthly', { params }),

  getQuotesProfitList: (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/profit/quotes', { params }),

  getBySalesperson: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/profit/by-salesperson', { params }),

  exportReport: (params?: {
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'excel';
  }) => api.get('/profit/export', { params, responseType: 'blob' }),
};
