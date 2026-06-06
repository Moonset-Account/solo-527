export async function serverFetch<T>(
  request: Request,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const origin = new URL(request.url).origin;
  const url = path.startsWith("http") ? path : `${origin}/api${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Cookie": request.headers.get("Cookie") || "",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "请求失败" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export function withSetCookie<T>(response: Response, data: T, init?: ResponseInit) {
  const setCookie = response.headers.get("set-cookie");
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...(setCookie ? { "Set-Cookie": setCookie } : {}),
    },
  });
}
