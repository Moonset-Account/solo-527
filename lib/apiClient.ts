"use client";

import { TimeWindow } from "./dataStore";

function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  return searchParams.toString();
}

function windowToParams(window?: TimeWindow): Record<string, any> {
  if (!window) return {};
  return {
    startDate: window.startDate,
    endDate: window.endDate,
    startHour: window.startHour,
    endHour: window.endHour,
    peakPeriod: window.peakPeriod,
  };
}

export const api = {
  async getArrivals(params?: {
    routeId?: string;
    stationId?: string;
    tripId?: string;
    includeDetour?: boolean;
    crowdingMode?: boolean;
    hourTrend?: boolean;
    drillLevel?: string;
    drillId?: string;
    window?: TimeWindow;
  }) {
    const query = buildQueryParams({
      ...params,
      ...windowToParams(params?.window),
    });
    const res = await fetch(`/api/arrivals?${query}`);
    if (!res.ok) throw new Error("获取到站记录失败");
    return res.json();
  },

  async getComparison(params?: {
    routeIds?: string[];
    peakPeriod?: string;
    window?: TimeWindow;
  }) {
    const query = buildQueryParams({
      ...params,
      ...windowToParams(params?.window),
    });
    const res = await fetch(`/api/comparison?${query}`);
    if (!res.ok) throw new Error("获取线路对比数据失败");
    return res.json();
  },

  async getComplaints(params?: {
    routeId?: string;
    status?: string;
    category?: string;
    window?: TimeWindow;
  }) {
    const query = buildQueryParams({
      ...params,
      ...windowToParams(params?.window),
    });
    const res = await fetch(`/api/complaints?${query}`);
    if (!res.ok) throw new Error("获取投诉数据失败");
    return res.json();
  },

  async getAnomalies(params?: {
    routeId?: string;
    type?: string;
    resolved?: boolean;
    window?: TimeWindow;
  }) {
    const query = buildQueryParams({
      ...params,
      ...windowToParams(params?.window),
    });
    const res = await fetch(`/api/anomalies?${query}`);
    if (!res.ok) throw new Error("获取异常数据失败");
    return res.json();
  },

  async updateAnomalyNote(id: string, notes: string) {
    const res = await fetch(`/api/anomalies`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes }),
    });
    if (!res.ok) throw new Error("更新备注失败");
    return res.json();
  },

  async resolveAnomaly(id: string, resolvedBy: string) {
    const res = await fetch(`/api/anomalies`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved: true, resolvedBy }),
    });
    if (!res.ok) throw new Error("标记解决失败");
    return res.json();
  },

  async getCards(params?: {
    routeId?: string;
    stationId?: string;
    tripId?: string;
    window?: TimeWindow;
  }) {
    const query = buildQueryParams({
      ...params,
      ...windowToParams(params?.window),
    });
    const res = await fetch(`/api/cards?${query}`);
    if (!res.ok) throw new Error("获取刷卡记录失败");
    return res.json();
  },

  async getWeather(params?: {
    date?: string;
    startHour?: number;
    endHour?: number;
  }) {
    const query = buildQueryParams(params || {});
    const res = await fetch(`/api/weather?${query}`);
    if (!res.ok) throw new Error("获取天气数据失败");
    return res.json();
  },

  async getDetours(params?: {
    routeId?: string;
    window?: TimeWindow;
  }) {
    const query = buildQueryParams({
      ...params,
      ...windowToParams(params?.window),
    });
    const res = await fetch(`/api/detours?${query}`);
    if (!res.ok) throw new Error("获取绕行信息失败");
    return res.json();
  },

  async getStations(params?: {
    stationId?: string;
    crowdingMode?: boolean;
    window?: TimeWindow;
    routeId?: string;
  }) {
    const query = buildQueryParams({
      ...params,
      ...windowToParams(params?.window),
    });
    const res = await fetch(`/api/stations?${query}`);
    if (!res.ok) throw new Error("获取站点数据失败");
    return res.json();
  },

  async getRoutes(routeId?: string) {
    const query = buildQueryParams({ routeId });
    const res = await fetch(`/api/routes?${query}`);
    if (!res.ok) throw new Error("获取线路数据失败");
    return res.json();
  },
};
