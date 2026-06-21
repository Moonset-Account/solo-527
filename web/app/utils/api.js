const API_BASE = 'http://localhost:3001/api';

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
};

export const api = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return apiRequest(url, { method: 'GET' });
  },
  post: (endpoint, body) =>
    apiRequest(endpoint, { method: 'POST', body }),
  put: (endpoint, body) =>
    apiRequest(endpoint, { method: 'PUT', body }),
  delete: (endpoint) =>
    apiRequest(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) =>
    apiRequest(endpoint, { method: 'POST', body: formData }),
};

export default api;
