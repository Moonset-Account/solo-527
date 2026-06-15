import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
}

export function useApi<T = unknown>(): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (url: string, options?: RequestInit): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `请求失败: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}
