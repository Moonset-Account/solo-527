import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types';

declare module 'axios' {
  interface AxiosInstance {
    request<T = any>(config: AxiosRequestConfig): Promise<T>;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  }
}

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const data = response.data;
    if (data.code === 0) {
      return data.data as any;
    }
    message.error(data.message || '请求失败');
    return Promise.reject(new Error(data.message));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else {
      message.error(error.response?.data?.message || error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export default request;
