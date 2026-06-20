import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import NProgress from 'nprogress';

const TOKEN_KEY = 'access_token';

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

service.interceptors.request.use(
  (config) => {
    NProgress.start();
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    NProgress.done();
    return response.data;
  },
  (error) => {
    NProgress.done();
    const { response } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
          }).then(() => {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('user_info');
            window.location.href = '/login';
          });
          break;
        case 403:
          ElMessage.error('权限不足，无法访问该资源');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器内部错误，请稍后重试');
          break;
        default:
          ElMessage.error(response.data?.message || '请求失败');
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络设置');
    }
    
    return Promise.reject(error);
  },
);

export default service;
