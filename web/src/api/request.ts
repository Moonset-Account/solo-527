import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
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
      const { status, data } = error.response;
      let message = '请求失败';
      
      if (data?.message) {
        message = typeof data.message === 'string' ? data.message : data.message[0];
      } else {
        switch (status) {
          case 400:
            message = '请求参数错误';
            break;
          case 401:
            message = '未授权，请重新登录';
            localStorage.removeItem('token');
            window.location.href = '/login';
            break;
          case 403:
            message = '没有权限访问';
            break;
          case 404:
            message = '请求资源不存在';
            break;
          case 500:
            message = '服务器内部错误';
            break;
          case 502:
            message = '网关错误';
            break;
          case 503:
            message = '服务不可用';
            break;
          case 504:
            message = '网关超时';
            break;
        }
      }

      console.error('API Error:', { status, message, data });
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error('网络错误，请检查网络连接'));
    } else {
      return Promise.reject(new Error(error.message || '请求失败'));
    }
  }
);

export default request;

export const get = <T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request.get(url, { params, ...config });
};

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request.post(url, data, config);
};

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return request.put(url, data, config);
};

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return request.delete(url, config);
};
