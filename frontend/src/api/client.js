import axios from 'axios';
import { message } from 'antd';

const TOKEN_KEY = 'carwash_token';
const USER_KEY = 'carwash_user';

const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      if (status === 403) {
        message.error('没有权限访问该资源');
        return Promise.reject(error);
      }
      
      if (status >= 500) {
        message.error('服务器错误，请稍后重试');
        return Promise.reject(error);
      }
      
      const errorMessage = data?.detail || data?.message || '请求失败';
      message.error(errorMessage);
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

const request = {
  get: (url, params = {}, config = {}) => {
    return apiClient.get(url, { params, ...config });
  },
  
  post: (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
  },
  
  put: (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
  },
  
  patch: (url, data = {}, config = {}) => {
    return apiClient.patch(url, data, config);
  },
  
  delete: (url, config = {}) => {
    return apiClient.delete(url, config);
  },
  
  upload: (url, file, config = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  },
};

export default apiClient;
export { request, TOKEN_KEY, USER_KEY };
