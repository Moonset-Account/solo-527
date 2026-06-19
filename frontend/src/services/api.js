import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/me/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

export const residentsAPI = {
  list: (params) => api.get('/residents/', { params }),
  detail: (id) => api.get(`/residents/${id}/`),
  create: (data) => api.post('/residents/', data),
  update: (id, data) => api.put(`/residents/${id}/`, data),
  delete: (id) => api.delete(`/residents/${id}/`),
  getProcessRecords: (id) => api.get(`/residents/${id}/process-records/`),
  addProcessRecord: (id, data) => api.post(`/residents/${id}/process-records/`, data),
  export: (params) => api.get('/residents/export/', { params, responseType: 'blob' }),
};

export const topicsAPI = {
  list: (params) => api.get('/topics/', { params }),
  detail: (id) => api.get(`/topics/${id}/`),
  create: (data) => api.post('/topics/', data),
  update: (id, data) => api.put(`/topics/${id}/`, data),
  delete: (id) => api.delete(`/topics/${id}/`),
  getProcessRecords: (id) => api.get(`/topics/${id}/process-records/`),
  addProcessRecord: (id, data) => api.post(`/topics/${id}/process-records/`, data),
  changeStatus: (id, action, data) => api.post(`/topics/${id}/${action}/`, data),
  export: (params) => api.get('/topics/export/', { params, responseType: 'blob' }),
};

export const votingAPI = {
  list: (params) => api.get('/voting/', { params }),
  detail: (id) => api.get(`/voting/${id}/`),
  create: (data) => api.post('/voting/', data),
  update: (id, data) => api.put(`/voting/${id}/`, data),
  delete: (id) => api.delete(`/voting/${id}/`),
  castVote: (data) => api.post('/voting/', data),
  handleException: (id, data) => api.post(`/voting/${id}/handle-exception/`, data),
  getExceptionList: (params) => api.get('/voting/exception-list/', { params }),
  getStatistics: (topicId) => api.get(`/voting/statistics/?topic=${topicId}`),
  export: (params) => api.get('/voting/export/', { params, responseType: 'blob' }),
};

export const patrolAPI = {
  routes: {
    list: (params) => api.get('/patrol/routes/', { params }),
    detail: (id) => api.get(`/patrol/routes/${id}/`),
    create: (data) => api.post('/patrol/routes/', data),
    update: (id, data) => api.put(`/patrol/routes/${id}/`, data),
    delete: (id) => api.delete(`/patrol/routes/${id}/`),
  },
  tasks: {
    list: (params) => api.get('/patrol/tasks/', { params }),
    detail: (id) => api.get(`/patrol/tasks/${id}/`),
    create: (data) => api.post('/patrol/tasks/', data),
    update: (id, data) => api.put(`/patrol/tasks/${id}/`, data),
    delete: (id) => api.delete(`/patrol/tasks/${id}/`),
    start: (id) => api.post(`/patrol/tasks/${id}/start/`),
    complete: (id, data) => api.post(`/patrol/tasks/${id}/complete/`, data),
    getProcessRecords: (id) => api.get(`/patrol/tasks/${id}/process-records/`),
    addProcessRecord: (id, data) => api.post(`/patrol/tasks/${id}/process-records/`, data),
  },
  checkins: {
    list: (params) => api.get('/patrol/check-ins/', { params }),
    create: (data, taskId) => api.post(`/patrol/tasks/${taskId}/check-in/`, data),
  },
  export: (params) => api.get('/patrol/export/', { params, responseType: 'blob' }),
};

export const assistanceAPI = {
  demands: {
    list: (params) => api.get('/assistance/demands/', { params }),
    detail: (id) => api.get(`/assistance/demands/${id}/`),
    create: (data) => api.post('/assistance/demands/', data),
    update: (id, data) => api.put(`/assistance/demands/${id}/`, data),
    delete: (id) => api.delete(`/assistance/demands/${id}/`),
    getProcessRecords: (id) => api.get(`/assistance/demands/${id}/process-records/`),
    addProcessRecord: (id, data) => api.post(`/assistance/demands/${id}/process-records/`, data),
    changeStatus: (id, action, data) => api.post(`/assistance/demands/${id}/${action}/`, data),
  },
  progress: {
    list: (params) => api.get('/assistance/progress/', { params }),
    detail: (id) => api.get(`/assistance/progress/${id}/`),
    create: (data) => api.post('/assistance/progress/', data),
    update: (id, data) => api.put(`/assistance/progress/${id}/`, data),
  },
  export: (params) => api.get('/assistance/export/', { params, responseType: 'blob' }),
};

export const tasksAPI = {
  list: (params) => api.get('/tasks/', { params }),
  detail: (id) => api.get(`/tasks/${id}/`),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.put(`/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/${id}/`),
  getProcessRecords: (id) => api.get(`/tasks/${id}/process-records/`),
  addProcessRecord: (id, data) => api.post(`/tasks/${id}/process-records/`, data),
  assign: (id, data) => api.post(`/tasks/${id}/assign/`, data),
  start: (id) => api.post(`/tasks/${id}/start/`),
  complete: (id, data) => api.post(`/tasks/${id}/complete/`, data),
  kanban: (params) => api.get('/tasks/kanban/', { params }),
  export: (params) => api.get('/tasks/export/', { params, responseType: 'blob' }),
};

export const volunteersAPI = {
  list: (params) => api.get('/volunteers/', { params }),
  detail: (id) => api.get(`/volunteers/${id}/`),
  create: (data) => api.post('/volunteers/', data),
  update: (id, data) => api.put(`/volunteers/${id}/`, data),
  delete: (id) => api.delete(`/volunteers/${id}/`),
  routes: {
    list: (params) => api.get('/volunteers/routes/', { params }),
    detail: (id) => api.get(`/volunteers/routes/${id}/`),
    create: (data) => api.post('/volunteers/routes/', data),
    update: (id, data) => api.put(`/volunteers/routes/${id}/`, data),
    delete: (id) => api.delete(`/volunteers/routes/${id}/`),
  },
  assignments: {
    list: (params) => api.get('/volunteers/assignments/', { params }),
    create: (data) => api.post('/volunteers/assignments/', data),
    update: (id, data) => api.put(`/volunteers/assignments/${id}/`, data),
    delete: (id) => api.delete(`/volunteers/assignments/${id}/`),
  },
  export: (params) => api.get('/volunteers/export/', { params, responseType: 'blob' }),
};

export const notificationsAPI = {
  list: (params) => api.get('/notifications/', { params }),
  detail: (id) => api.get(`/notifications/${id}/`),
  myNotifications: (params) => api.get('/notifications/my-notifications/', { params }),
  unread: (params) => api.get('/notifications/unread/', { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/mark-as-read/`),
  markAllAsRead: (data) => api.post('/notifications/mark-all-read/', data),
  unreadCount: () => api.get('/notifications/unread-count/'),
};

export const commonAPI = {
  export: (module, params) => 
    api.get(`/common/export/?module=${module}`, { params, responseType: 'blob' }),
  getStatistics: () => api.get('/common/statistics/'),
};

export default api;
