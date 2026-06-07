import { useSearchParams } from "@remix-run/react";
import type { FilterState } from "../types";

export function useFilterContext(): [FilterState, (filters: Partial<FilterState>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: FilterState = {
    fieldIds: searchParams.getAll("fieldIds").map(Number).filter(Boolean),
    cropIds: searchParams.getAll("cropIds").map(Number).filter(Boolean),
    pumpIds: searchParams.getAll("pumpIds").map(Number).filter(Boolean),
    strategyIds: searchParams.getAll("strategyIds").map(Number).filter(Boolean),
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  };

  const setFilters = (newFilters: Partial<FilterState>) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        nextParams.delete(key);
        value.forEach((v) => nextParams.append(key, String(v)));
      } else if (value === "" || value === undefined || value === null) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams, { preventScrollReset: true });
  };

  return [filters, setFilters];
}

export function buildQueryString(filters: Partial<FilterState>): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      value.forEach((v) => params.append(key, String(v)));
    } else if (value && !Array.isArray(value)) {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "高":
      return "#ef4444";
    case "中":
      return "#f59e0b";
    case "低":
      return "#10b981";
    default:
      return "#6b7280";
  }
}

export function getSeverityBg(severity: string): string {
  switch (severity) {
    case "高":
      return "#fef2f2";
    case "中":
      return "#fffbeb";
    case "低":
      return "#ecfdf5";
    default:
      return "#f3f4f6";
  }
}
