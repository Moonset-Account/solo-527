export interface ApiError {
  code: string;
  message: string;
  detail?: string;
}

interface ApiResponseWrapper<T> {
  data?: T;
  code?: string;
  message?: string;
  detail?: string;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkErr) {
    throw {
      code: "NETWORK_ERROR",
      message: "网络连接失败，请检查网络后重试",
      detail: (networkErr as Error).message,
    } as ApiError;
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
    throw {
      code: "TOKEN_EXPIRED",
      message: "登录已过期，请重新登录",
    } as ApiError;
  }

  let data: ApiResponseWrapper<T>;
  try {
    data = (await response.json()) as ApiResponseWrapper<T>;
  } catch (parseErr) {
    throw {
      code: "PARSE_ERROR",
      message: "服务器返回的数据格式异常",
      detail: (parseErr as Error).message,
    } as ApiError;
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      (response.status === 400 && "提交的数据有误，请检查后重试") ||
      (response.status === 403 && "您没有权限执行此操作，请联系管理员") ||
      (response.status === 404 && "请求的内容不存在或已被删除") ||
      (response.status === 409 && "数据冲突，可能已被他人修改") ||
      (response.status === 429 && "操作过于频繁，请稍后再试") ||
      (response.status >= 500 && "服务器异常，请稍后再试或联系技术支持") ||
      "请求失败，请稍后重试";

    throw {
      code: data?.code || `HTTP_${response.status}`,
      message: errorMessage,
      detail: data?.detail,
    } as ApiError;
  }

  if (data && typeof data === "object" && "data" in data) {
    return data.data as T;
  }

  return data as unknown as T;
}

function buildQueryString(
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export async function get<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return request<T>(`${url}${buildQueryString(params)}`);
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function del<T>(url: string): Promise<T> {
  return request<T>(url, {
    method: "DELETE",
  });
}
