import axios from 'axios';
import { FilterState, ChartDataResponse, FilterOptions, SavedView } from '../types';

const API_BASE = '/api';

export const api = {
  getFilterOptions: (): Promise<FilterOptions> => {
    return axios.get(`${API_BASE}/analytics/options`).then(res => res.data);
  },

  getDashboardData: (filters: FilterState): Promise<ChartDataResponse> => {
    return axios.post(`${API_BASE}/analytics/dashboard`, filters).then(res => res.data);
  },

  getSavedViews: (): Promise<SavedView[]> => {
    return axios.get(`${API_BASE}/analytics/views`).then(res => res.data);
  },

  saveView: (name: string, filters: FilterState, is_public: boolean = false): Promise<SavedView> => {
    return axios.post(`${API_BASE}/analytics/views`, { name, filters, is_public }).then(res => res.data);
  },

  deleteView: (id: number): Promise<any> => {
    return axios.delete(`${API_BASE}/analytics/views/${id}`).then(res => res.data);
  },

  exportReport: async (filters: FilterState): Promise<Blob> => {
    const response = await axios.post(`${API_BASE}/export/report`, {
      filters,
      report_type: 'summary',
      format: 'xlsx'
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportDetails: async (filters: FilterState): Promise<Blob> => {
    const response = await axios.post(`${API_BASE}/export/details`, filters, {
      responseType: 'blob'
    });
    return response.data;
  }
};
