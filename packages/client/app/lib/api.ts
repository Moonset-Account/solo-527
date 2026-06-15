export const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:3001/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.headers.get("Content-Type")?.includes("application/json")) {
      const data = await res.json();
      throw new Error(data.error || data.message || `请求失败: ${res.status}`);
    }
    throw new Error(`请求失败: ${res.status}`);
  }

  const contentType = res.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.blob() as unknown as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  download: async (path: string, filename: string) => {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`下载失败: ${res.status}`);
    }
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },
};

export interface ApiListResponse<T> {
  success: boolean;
  data: {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ApiSingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
