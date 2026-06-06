'use client';

import { getCurrentUser } from './auth';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const user = getCurrentUser();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('X-User-Id', user.id);

  return fetch(url, {
    ...options,
    headers,
  });
}

export function getCurrentUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('current_user_id');
  }
  return null;
}
