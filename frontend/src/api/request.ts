import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

service.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        router.push('/login');
      }
      const msg = error.response.data?.message || error.response.statusText;
      ElMessage.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } else {
      ElMessage.error('网络请求失败');
    }
    return Promise.reject(error);
  },
);

export default service;
