import axios from 'axios';
import { useUserStore } from '@/store/user';
import { showToast } from 'vant';
import { addPendingRequest } from './offline';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const userStore = useUserStore();
        userStore.logout();
        window.location.href = '/login';
      }
      if (!error.config?.silent) {
        showToast(error.response.data.error || '请求失败');
      }
    } else if (error.request) {
      const originalRequest = error.config;
      const shouldCache = originalRequest.offlineCache !== false && 
                          ['post', 'put', 'patch', 'delete'].includes(originalRequest.method?.toLowerCase()) &&
                          !navigator.onLine;
      
      if (!originalRequest._retry && shouldCache) {
        const data = originalRequest.data;
        let parsedData = data;
        if (typeof data === 'string') {
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = data;
          }
        }
        addPendingRequest(
          originalRequest.url,
          originalRequest.method,
          parsedData,
          originalRequest.params
        );
        showToast('网络离线，请求已缓存，将在恢复后重试');
      } else if (!originalRequest._retry && !navigator.onLine) {
        showToast('网络离线');
      } else if (!originalRequest._retry) {
        showToast('网络连接失败');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
