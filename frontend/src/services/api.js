import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

export const getFloors = () => api.get('/floors');
export const getAreas = (floorId) => api.get('/areas', { params: { floor_id: floorId } });
export const getUserGroups = () => api.get('/user-groups');
export const getSeatTypes = () => api.get('/seat-types');
export const getTimeSlots = () => api.get('/time-slots');
export const getAnomalies = (targetDate) => api.get('/anomalies', { params: { target_date: targetDate } });
export const getHeatmap = (params) => api.get('/heatmap', { params });
export const getNoShowTrend = (params) => api.get('/no-show-trend', { params });
export const getAreaComparison = (params) => api.get('/area-comparison', { params });
export const getFunnel = (params) => api.get('/funnel', { params });
export const getSummary = (params) => api.get('/summary', { params });
export const getExamWeekComparison = () => api.get('/exam-week-comparison');
export const exportCSV = (params) => {
  const cleanParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleanParams[key] = value;
    }
  });
  const queryStr = new URLSearchParams(cleanParams).toString();
  window.open(`/api/report/csv?${queryStr}`, '_blank');
};
export const exportPDF = (params) => {
  const cleanParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleanParams[key] = value;
    }
  });
  const queryStr = new URLSearchParams(cleanParams).toString();
  window.open(`/api/report/pdf?${queryStr}`, '_blank');
};

export default api;
