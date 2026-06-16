import axios from 'axios';
import { message, Modal } from 'antd';
import { getToken, clearAuth } from './auth.js';
import router from '../router/index.jsx';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  withCredentials: true,
});

request.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (typeof res === 'object' && 'code' in res) {
      if (res.code === 0) return res;
      if (res.code === 401 || res.message?.includes('未授权') || res.message?.includes('登录已过期')) {
        clearAuth();
        Modal.error({
          title: '登录已过期',
          content: res.message || '请重新登录',
          okText: '去登录',
          onOk: () => {
            if (!location.hash.startsWith('#/login')) {
              router.navigate('/login');
            }
          },
        });
      } else {
        message.error(res.message || '请求失败');
      }
      return Promise.reject(res);
    }
    return res;
  },
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message;
    if (status === 401) {
      clearAuth();
      if (!location.hash.startsWith('#/login')) {
        router.navigate('/login');
      }
    } else if (status === 403) {
      message.error('无权限执行此操作');
    } else if (status === 404) {
      message.error('资源不存在');
    } else if (status >= 500) {
      message.error(msg || '服务器内部错误，请稍后重试');
    } else if (!axios.isCancel(error)) {
      message.error(msg || '网络请求失败');
    }
    return Promise.reject(error);
  }
);

export const apiGet = (url, params, options) => request.get(url, { params, ...options });
export const apiPost = (url, data, options) => request.post(url, data, options);
export const apiPut = (url, data, options) => request.put(url, data, options);
export const apiPatch = (url, data, options) => request.patch(url, data, options);
export const apiDelete = (url, params, options) => request.delete(url, { params, ...options });
export const apiDownload = async (url, data, method = 'post', filename) => {
  const config = {
    method,
    url,
    data,
    responseType: 'blob',
  };
  const res = await request(config);
  const blob = new Blob([res], { type: res.type || 'application/octet-stream' });
  const link = document.createElement('a');
  const urlObj = URL.createObjectURL(blob);
  link.href = urlObj;
  if (filename) link.download = filename;
  else {
    const cd = res.headers?.['content-disposition'];
    if (cd) {
      const m = cd.match(/filename\*=UTF-8''([^;]+)/);
      if (m) link.download = decodeURIComponent(m[1]);
    }
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(urlObj);
};

export default request;
