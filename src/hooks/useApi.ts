"use client";

import { useState, useCallback } from "react";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token");

  const request = useCallback(
    async <T = unknown>(
      url: string,
      options: RequestInit = {}
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      try {
        const token = getToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(url, {
          ...options,
          headers,
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || "请求失败");
        }

        return data as ApiResponse<T>;
      } catch (err) {
        const message = err instanceof Error ? err.message : "网络错误";
        setError(message);
        return { success: false, error: message } as ApiResponse<T>;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const get = useCallback(
    <T = unknown>(url: string) => request<T>(url, { method: "GET" }),
    [request]
  );

  const post = useCallback(
    <T = unknown>(url: string, body?: unknown) =>
      request<T>(url, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),
    [request]
  );

  const put = useCallback(
    <T = unknown>(url: string, body?: unknown) =>
      request<T>(url, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      }),
    [request]
  );

  const del = useCallback(
    <T = unknown>(url: string) => request<T>(url, { method: "DELETE" }),
    [request]
  );

  const download = useCallback(
    async (url: string, filename: string) => {
      setLoading(true);
      setError(null);

      try {
        const token = getToken();
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "下载失败");
          return { success: false, error: data.error };
        }

        const blob = await res.blob();
        const urlObject = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = urlObject;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(urlObject);
        document.body.removeChild(a);

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "下载失败";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    get,
    post,
    put,
    del,
    download,
  };
}
