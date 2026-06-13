import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 60000,
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

const parseBlobError = async (blob) => {
  try {
    const text = await blob.text();
    return JSON.parse(text);
  } catch {
    return { message: '请求失败' };
  }
};

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      let errMsg = '请求失败';

      if (data instanceof Blob) {
        const parsed = await parseBlobError(data);
        errMsg = parsed.message || errMsg;
      } else {
        errMsg = data?.message || errMsg;
      }
      
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      } else if (status === 403) {
        message.error(errMsg || '无权限访问');
      } else {
        message.error(errMsg || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求失败');
    }
    
    return Promise.reject(error);
  }
);

export default request;
