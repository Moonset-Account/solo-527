import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  suggestion?: string;
  traceId?: string;
}

const request = axios.create({
  baseURL: '/api',
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
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    if (res && typeof res.code !== 'undefined') {
      if (res.code === 0) {
        return response;
      }
      handleBusinessError(res);
      return Promise.reject(res);
    }
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    handleHttpError(error);
    return Promise.reject(error.response?.data || error);
  }
);

function handleBusinessError(res: ApiResponse) {
  const { code, message: msg, suggestion } = res;

  if (code === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    message.error('登录已过期，请重新登录');
    return;
  }

  const errorMsg = suggestion ? `${msg}。${suggestion}` : msg;

  switch (code) {
    case 400:
      message.warning(errorMsg);
      break;
    case 403:
      message.error(errorMsg || '您没有权限执行此操作');
      break;
    case 404:
      message.warning(errorMsg || '请求的资源不存在');
      break;
    case 409:
      message.warning(errorMsg || '数据冲突，请刷新后重试');
      break;
    case 422:
      message.warning(errorMsg || '数据验证失败');
      break;
    case 500:
      message.error(errorMsg || '服务器错误，请稍后重试');
      break;
    case 503:
      message.error(errorMsg || '服务暂时不可用');
      break;
    default:
      message.error(errorMsg || `操作失败（错误码：${code}）`);
  }
}

function handleHttpError(error: AxiosError<ApiResponse>) {
  const status = error.response?.status;
  const data = error.response?.data;

  if (data?.message) {
    handleBusinessError(data);
    return;
  }

  switch (status) {
    case 400:
      message.error('请求参数错误，请检查输入内容是否正确');
      break;
    case 401:
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      message.error('登录已过期，请重新登录');
      break;
    case 403:
      message.error('抱歉，您没有权限访问此资源，请联系管理员获取权限');
      break;
    case 404:
      message.error('请求的接口不存在，请联系技术支持');
      break;
    case 408:
      message.warning('请求超时，请检查网络连接后重试');
      break;
    case 413:
      message.error('上传的文件过大，请压缩后重试');
      break;
    case 422:
      message.error('提交的数据格式不正确，请检查后重新提交');
      break;
    case 500:
      message.error('服务器内部错误，请稍后重试或联系技术支持');
      break;
    case 502:
    case 503:
    case 504:
      message.error('服务器暂时无法访问，请稍后重试或查看系统公告');
      break;
    default:
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        message.warning('请求超时，请检查网络连接后重试');
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        message.error('网络连接失败，请检查网络是否正常');
      } else {
        message.error(`请求失败：${error.message}，如问题持续请联系技术支持`);
      }
  }
}

export default request;

export async function get<T = any>(url: string, params?: any): Promise<T> {
  const res = await request.get<ApiResponse<T>>(url, { params });
  return res.data.data as T;
}

export async function post<T = any>(url: string, data?: any): Promise<T> {
  const res = await request.post<ApiResponse<T>>(url, data);
  return res.data.data as T;
}

export async function put<T = any>(url: string, data?: any): Promise<T> {
  const res = await request.put<ApiResponse<T>>(url, data);
  return res.data.data as T;
}

export async function patch<T = any>(url: string, data?: any): Promise<T> {
  const res = await request.patch<ApiResponse<T>>(url, data);
  return res.data.data as T;
}

export async function del<T = any>(url: string): Promise<T> {
  const res = await request.delete<ApiResponse<T>>(url);
  return res.data.data as T;
}
