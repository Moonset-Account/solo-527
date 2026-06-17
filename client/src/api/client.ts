import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

client.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = '请求失败';

      if (data && typeof data === 'object' && 'message' in data) {
        errorMessage = (data as { message: string }).message;
      } else if (status === 400) {
        errorMessage = '请求参数错误';
      } else if (status === 401) {
        errorMessage = '未授权，请重新登录';
      } else if (status === 403) {
        errorMessage = '没有权限访问';
      } else if (status === 404) {
        errorMessage = '请求资源不存在';
      } else if (status === 500) {
        errorMessage = '服务器内部错误';
      }

      message.error(errorMessage);
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error(error.message || '请求失败');
    }

    return Promise.reject(error);
  },
);

export default client;
