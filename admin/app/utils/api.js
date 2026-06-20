const API_BASE = '/api';

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  get: (endpoint, params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`${endpoint}${queryString}`, { method: 'GET' });
  },
  
  post: (endpoint, body) => {
    return apiRequest(endpoint, { method: 'POST', body });
  },
  
  put: (endpoint, body) => {
    return apiRequest(endpoint, { method: 'PUT', body });
  },
  
  delete: (endpoint) => {
    return apiRequest(endpoint, { method: 'DELETE' });
  }
};

export default api;
