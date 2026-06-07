import { useState, useEffect, useCallback } from "react";
import type { FilterParams, UserRole } from "@/types";
import { useAppStore } from "@/store";

function buildQueryString(filters: FilterParams): string {
  const params = new URLSearchParams();
  if (filters.positions.length > 0) params.set("positions", filters.positions.join(","));
  if (filters.departments.length > 0) params.set("departments", filters.departments.join(","));
  if (filters.recruiters.length > 0) params.set("recruiters", filters.recruiters.join(","));
  if (filters.channels.length > 0) params.set("channels", filters.channels.join(","));
  if (filters.stages.length > 0) params.set("stages", filters.stages.join(","));
  if (filters.dateRange.start) params.set("startDate", filters.dateRange.start);
  if (filters.dateRange.end) params.set("endDate", filters.dateRange.end);
  return params.toString();
}

function buildRoleHeaders(role: UserRole): Record<string, string> {
  const headers: Record<string, string> = { "X-User-Role": role };
  if (role === "recruiting_manager") {
    headers["X-Department"] = "工程部";
  }
  if (role === "interviewer") {
    headers["X-User-Id"] = "iv-1";
  }
  return headers;
}

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function useApi<T>(endpoint: string, filters: FilterParams) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const role = useAppStore((s) => s.role);

  const qs = buildQueryString(filters);
  const url = `/api${endpoint}${qs ? `?${qs}` : ""}`;
  const cacheKey = `${role}:${url}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data as T);
      setLoading(false);
      return;
    }

    try {
      const headers = buildRoleHeaders(role);
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      const result = json.data !== undefined ? json.data : json;
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      setData(result as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url, cacheKey, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
