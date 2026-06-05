import axios from 'axios';
import { useUserStore } from '@/store/user';
import { showToast } from 'vant';

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
      showToast(error.response.data.error || '请求失败');
    } else if (error.request) {
      const originalRequest = error.config;
      if (!originalRequest._retry && !navigator.onLine) {
        const pendingQueue = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
        pendingQueue.push({
          url: originalRequest.url,
          method: originalRequest.method,
          data: originalRequest.data,
          params: originalRequest.params,
          timestamp: Date.now()
        });
        localStorage.setItem('pendingRequests', JSON.stringify(pendingQueue));
        showToast('网络离线，请求已缓存，将在恢复后重试');
      } else {
        showToast('网络连接失败');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
