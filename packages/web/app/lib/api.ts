import type { ApiResponse } from "@app/shared";

const API_BASE = "";

async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({
      success: false,
      error: "解析响应失败",
    }));

    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
    };
  }
}

export const api = {
  get: <T>(url: string, params?: Record<string, any>) => {
    const query = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return request<T>(`${url}${query}`);
  },

  post: <T>(url: string, data?: any) =>
    request<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(url: string, data?: any) =>
    request<T>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string) =>
    request<T>(url, { method: "DELETE" }),

  upload: async (files: File[]): Promise<ApiResponse<any[]>> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`${API_BASE}/api/attachments/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      return await res.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "上传失败",
      };
    }
  },
};

export const formatMoney = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (date: string | Date): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
