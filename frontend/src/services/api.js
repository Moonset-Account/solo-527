import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('API Error:', err);
    return Promise.reject(err.response?.data || { message: '请求失败' });
  }
);

export const counselorApi = {
  list: (params) => request.get('/counselors', { params }),
  get: (id) => request.get(`/counselors/${id}`),
  create: (data) => request.post('/counselors', data),
  update: (id, data) => request.put(`/counselors/${id}`, data),
  remove: (id) => request.delete(`/counselors/${id}`),
};

export const timeSlotApi = {
  list: (params) => request.get('/timeslots', { params }),
  create: (data) => request.post('/timeslots', data),
  createBatch: (data) => request.post('/timeslots/batch', data),
  update: (id, data) => request.put(`/timeslots/${id}`, data),
  remove: (id) => request.delete(`/timeslots/${id}`),
};

export const appointmentApi = {
  list: (params) => request.get('/appointments', { params }),
  get: (id) => request.get(`/appointments/${id}`),
  create: (data) => request.post('/appointments', data),
  confirm: (id, data) => request.post(`/appointments/${id}/confirm`, data),
  checkIn: (id, data) => request.post(`/appointments/${id}/checkin`, data),
  complete: (id, data) => request.post(`/appointments/${id}/complete`, data),
  noShow: (id, data) => request.post(`/appointments/${id}/noshow`, data),
  cancel: (id, data) => request.post(`/appointments/${id}/cancel`, data),
  waitlistExpire: (id, data) => request.post(`/appointments/${id}/waitlist-expire`, data),
};

export const statsApi = {
  overview: (params) => request.get('/stats/overview', { params }),
  daily: (params) => request.get('/stats/daily', { params }),
};

const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params || {}).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
        && String(v).trim().toLowerCase() !== 'undefined'
        && String(v).trim().toLowerCase() !== 'null'
    )
  );

export const exportApi = {
  appointments: (params) => {
    const clean = cleanParams(params);
    const query = new URLSearchParams(clean).toString();
    return query ? `/api/export/appointments?${query}` : '/api/export/appointments';
  },
};
