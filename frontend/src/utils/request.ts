import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = '/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface HttpRequest {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  defaults: any;
  interceptors: any;
}

const request = axiosInstance as unknown as HttpRequest;

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: any) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('没有权限访问该资源');
      } else if (status === 404) {
        message.error('请求的资源不存在');
      } else if (status === 500) {
        message.error('服务器内部错误');
      } else {
        message.error(error.response.data?.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

export default request;
