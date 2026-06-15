function getApiBase(): string {
  if (typeof window !== "undefined" && window.ENV?.API_BASE_URL) {
    return window.ENV.API_BASE_URL;
  }
  if (typeof process !== "undefined" && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  const port = typeof process !== "undefined" && process.env?.PORT
    ? Number(process.env.PORT) + 1
    : 3001;
  return `http://127.0.0.1:${port}/api`;
}

export const API_BASE_URL = getApiBase();

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiBase()}${path}`;
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
    const url = `${getApiBase()}${path}`;
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
