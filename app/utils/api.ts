let token: string | null = null;

export function setAuthToken(t: string | null) {
  token = t;
  if (t) {
    localStorage.setItem('auth_token', t);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  if (!token) {
    token = localStorage.getItem('auth_token');
  }
  return token;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  
  const authToken = getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    setAuthToken(null);
    window.location.href = '/login';
    throw new Error('未授权');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  
  return response.json();
}

export async function apiFormData(url: string, formData: FormData): Promise<any> {
  const headers: Record<string, string> = {};
  const authToken = getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  });
  
  if (response.status === 401) {
    setAuthToken(null);
    window.location.href = '/login';
    throw new Error('未授权');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  
  return response.json();
}
