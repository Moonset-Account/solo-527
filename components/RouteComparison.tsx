"use client";

import { useState, useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { calculateComparisonMetrics, getRoutes } from "@/lib/dataStore";
import type { ComparisonMetric } from "@/types";

export default function RouteComparison() {
  const routes = getRoutes();
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(
    routes.slice(0, 3).map((r) => r.id)
  );
  const [peakPeriod, setPeakPeriod] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"radar" | "bar">("radar");

  const metrics = useMemo(() => {
    return calculateComparisonMetrics(
      selectedRoutes,
      peakPeriod === "all" ? undefined : (peakPeriod as any)
    );
  }, [selectedRoutes, peakPeriod]);

  const radarData = useMemo(() => {
    if (metrics.length === 0) return [];

    const maxLoad = Math.max(...metrics.map((m) => m.avgLoadFactor));
    const maxDelay = Math.max(...metrics.map((m) => m.avgDelaySeconds));
    const maxComplaints = Math.max(...metrics.map((m) => m.complaintCount), 1);
    const maxPassengers = Math.max(...metrics.map((m) => m.totalPassengers));

    const indicators = [
      { key: "onTimeRate", label: "准点率" },
      { key: "loadFactor", label: "满载率" },
      { key: "efficiency", label: "运行效率" },
      { key: "service", label: "服务质量" },
      { key: "capacity", label: "运力" },
    ];

    return indicators.map((indicator) => {
      const item: Record<string, any> = { indicator: indicator.label };
      metrics.forEach((m) => {
        let value = 0;
        switch (indicator.key) {
          case "onTimeRate":
            value = m.onTimeRate * 100;
            break;
          case "loadFactor":
            value = (m.avgLoadFactor / maxLoad) * 100;
            break;
          case "efficiency":
            value = maxDelay > 0 ? Math.max(0, 100 - (m.avgDelaySeconds / maxDelay) * 100) : 100;
            break;
          case "service":
            value = Math.max(0, 100 - (m.complaintCount / maxComplaints) * 100);
            break;
          case "capacity":
            value = (m.totalPassengers / maxPassengers) * 100;
            break;
        }
        item[m.routeName] = Number(value.toFixed(1));
      });
      return item;
    });
  }, [metrics]);

  const barData = useMemo(() => {
    return metrics.map((m) => ({
      name: m.routeName,
      准点率: Number((m.onTimeRate * 100).toFixed(1)),
      满载率: Number((m.avgLoadFactor * 100).toFixed(1)),
      平均延误: Number((m.avgDelaySeconds / 60).toFixed(1)),
      投诉数: m.complaintCount,
      客流量: m.totalPassengers,
    }));
  }, [metrics]);

  const handleRouteToggle = (routeId: string) => {
    setSelectedRoutes((prev) => {
      if (prev.includes(routeId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== routeId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, routeId];
    });
  };

  const getRouteColor = (index: number) => {
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">线路多维度对比</h3>
          <p className="text-sm text-gray-500 mt-1">
            选择多条线路进行综合指标对比分析
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("radar")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                viewMode === "radar"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              雷达图
            </button>
            <button
              onClick={() => setViewMode("bar")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                viewMode === "bar"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              柱状图
            </button>
          </div>

          <select
            value={peakPeriod}
            onChange={(e) => setPeakPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部时段</option>
            <option value="morning">早高峰</option>
            <option value="evening">晚高峰</option>
            <option value="off-peak">平峰</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => handleRouteToggle(route.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedRoutes.includes(route.id)
                ? "text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={
              selectedRoutes.includes(route.id)
                ? { backgroundColor: route.color }
                : {}
            }
          >
            {route.name}
          </button>
        ))}
      </div>

      <div className="h-[450px]">
        {viewMode === "radar" ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="indicator" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
              {metrics.map((m, index) => (
                <Radar
                  key={m.routeId}
                  name={m.routeName}
                  dataKey={m.routeName}
                  stroke={getRouteColor(index)}
                  fill={getRouteColor(index)}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Bar dataKey="准点率" name="准点率 (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="满载率" name="满载率 (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="平均延误" name="平均延误 (分钟)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m, index) => (
          <div
            key={m.routeId}
            className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
            style={{ borderColor: getRouteColor(index) + "40" }}
          >
            <div
              className="w-3 h-3 rounded-full mb-2"
              style={{ backgroundColor: getRouteColor(index) }}
            />
            <h4 className="font-semibold text-gray-900">{m.routeName}</h4>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">准点率</span>
                <span className="font-mono font-medium text-green-600">
                  {(m.onTimeRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">满载率</span>
                <span className="font-mono font-medium text-amber-600">
                  {(m.avgLoadFactor * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">投诉</span>
                <span className="font-mono font-medium text-red-600">{m.complaintCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
