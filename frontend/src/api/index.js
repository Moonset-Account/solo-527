import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || '请求失败';
    return Promise.reject(new Error(msg));
  }
);

export const getDashboard = () => api.get('/dashboard');
export const getProperties = (params) => api.get('/properties', { params });
export const getProperty = (id) => api.get(`/properties/${id}`);
export const createProperty = (data) => api.post('/properties', data);
export const updateProperty = (id, data) => api.put(`/properties/${id}`, data);
export const getPropertyHistory = (id) => api.get(`/properties/${id}/history`);
export const getVacancyStats = () => api.get('/properties/stats/vacancy');

export const getTenants = (params) => api.get('/tenants', { params });
export const getTenant = (id) => api.get(`/tenants/${id}`);
export const createTenant = (data) => api.post('/tenants', data);
export const updateTenant = (id, data) => api.put(`/tenants/${id}`, data);

export const getConsultants = () => api.get('/consultants');
export const createFollowUp = (id, data) => api.post(`/consultants/${id}/follow-ups`, data);
export const getFollowUps = (id, params) => api.get(`/consultants/${id}/follow-ups`, { params });

export const getViewings = (params) => api.get('/viewings', { params });
export const createViewing = (data) => api.post('/viewings', data);
export const updateViewing = (id, data) => api.put(`/viewings/${id}`, data);
export const getViewingHistory = (id) => api.get(`/viewings/${id}/history`);

export const getContracts = (params) => api.get('/contracts', { params });
export const getContract = (id) => api.get(`/contracts/${id}`);
export const createContract = (data) => api.post('/contracts', data);
export const reviewContract = (id, data) => api.put(`/contracts/${id}/review`, data);
export const signContract = (id, data) => api.put(`/contracts/${id}/sign`, data);
export const uploadContractAttachment = (id, data) => api.put(`/contracts/${id}/attachment`, data);
export const getContractHistory = (id) => api.get(`/contracts/${id}/history`);
export const getSigningProgress = () => api.get('/contracts/stats/signing-progress');

export const getBills = (params) => api.get('/bills', { params });
export const getOverdueBills = () => api.get('/bills/overdue');
export const getBill = (id) => api.get(`/bills/${id}`);
export const payBill = (id, data) => api.put(`/bills/${id}/pay`, data);
export const markBillOverdue = (id, data) => api.put(`/bills/${id}/mark-overdue`, data);
export const getBillHistory = (id) => api.get(`/bills/${id}/history`);

export const getTodos = (params) => api.get('/todos', { params });
export const getTodoStats = () => api.get('/todos/stats');
export const updateTodo = (id, data) => api.put(`/todos/${id}`, data);
export const closeTodo = (id, data) => api.put(`/todos/${id}/close`, data);
export const scanOverdue = () => api.post('/todos/scan-overdue');

export const getChangeLogs = (params) => api.get('/change-logs', { params });
export const getEntityChangeLogs = (type, id) => api.get(`/change-logs/${type}/${id}`);
