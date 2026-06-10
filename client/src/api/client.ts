import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getList = async <T>(url: string, params?: Record<string, unknown>): Promise<{ list: T[]; total: number; page: number; pageSize: number }> => {
  const response = await apiClient.get(url, { params });
  return response.data;
};

export const getOne = async <T>(url: string): Promise<T> => {
  const response = await apiClient.get(url);
  return response.data;
};

export const create = async <T>(url: string, data: unknown): Promise<T> => {
  const response = await apiClient.post(url, data);
  return response.data;
};

export const update = async <T>(url: string, data: unknown): Promise<T> => {
  const response = await apiClient.put(url, data);
  return response.data;
};

export const remove = async (url: string): Promise<void> => {
  await apiClient.delete(url);
};
