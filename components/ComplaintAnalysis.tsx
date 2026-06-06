"use client";

import { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getComplaints, getArrivalRecords, getRoutes } from "@/lib/dataStore";
import type { Complaint, ComparisonMetric } from "@/types";
import { AlertTriangle, Clock, Users, MessageSquare } from "lucide-react";

export default function ComplaintAnalysis() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const routes = getRoutes();
  const allComplaints = getComplaints();

  const filteredComplaints = useMemo(() => {
    let complaints = allComplaints;
    if (selectedRouteId !== "all") {
      complaints = complaints.filter((c) => c.routeId === selectedRouteId);
    }
    if (selectedCategory !== "all") {
      complaints = complaints.filter((c) => c.category === selectedCategory);
    }
    return complaints;
  }, [allComplaints, selectedRouteId, selectedCategory]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredComplaints.forEach((c) => {
      categories[c.category] = (categories[c.category] || 0) + 1;
    });
    const labels: Record<string, string> = {
      crowding: "拥挤",
      delay: "晚点",
      driver: "司机服务",
      vehicle: "车辆设施",
      other: "其他",
    };
    return Object.entries(categories).map(([key, value]) => ({
      name: labels[key] || key,
      value,
      key,
    }));
  }, [filteredComplaints]);

  const scatterData = useMemo(() => {
    const routeMetrics: Record<
      string,
      { complaints: number; avgDelay: number; avgLoad: number; totalPassengers: number }
    > = {};

    allComplaints.forEach((c) => {
      if (!routeMetrics[c.routeId]) {
        routeMetrics[c.routeId] = { complaints: 0, avgDelay: 0, avgLoad: 0, totalPassengers: 0 };
      }
      routeMetrics[c.routeId].complaints++;
    });

    Object.keys(routeMetrics).forEach((routeId) => {
      const arrivals = getArrivalRecords(routeId);
      if (arrivals.length > 0) {
        routeMetrics[routeId].avgDelay =
          arrivals.reduce((sum, a) => sum + a.delaySeconds, 0) / arrivals.length / 60;
        routeMetrics[routeId].avgLoad =
          arrivals.reduce((sum, a) => sum + a.loadFactor, 0) / arrivals.length;
        routeMetrics[routeId].totalPassengers = arrivals.reduce(
          (sum, a) => sum + a.passengerCount,
          0
        );
      }
    });

    return Object.entries(routeMetrics).map(([routeId, data]) => {
      const route = routes.find((r) => r.id === routeId);
      return {
        routeId,
        routeName: route?.name || routeId,
        complaints: data.complaints,
        avgDelay: Number(data.avgDelay.toFixed(1)),
        avgLoad: Number((data.avgLoad * 100).toFixed(1)),
        totalPassengers: data.totalPassengers,
      };
    });
  }, [allComplaints, routes]);

  const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#6b7280"];

  const categoryLabels: Record<string, string> = {
    crowding: "拥挤",
    delay: "晚点",
    driver: "司机服务",
    vehicle: "车辆设施",
    other: "其他",
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    open: { label: "待处理", color: "bg-red-100 text-red-700" },
    resolved: { label: "已解决", color: "bg-green-100 text-green-700" },
    closed: { label: "已关闭", color: "bg-gray-100 text-gray-700" },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">投诉关联分析</h3>
            <p className="text-sm text-gray-500 mt-1">
              分析投诉与满载率、延误等指标的关联性
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">线路</label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部线路</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">类别</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部类别</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">投诉总量</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{filteredComplaints.length}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">待处理</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {filteredComplaints.filter((c) => c.status === "open").length}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">已解决</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {filteredComplaints.filter((c) => c.status === "resolved").length}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium">解决率</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {filteredComplaints.length > 0
                ? (
                    (filteredComplaints.filter(
                      (c) => c.status === "resolved" || c.status === "closed"
                    ).length /
                      filteredComplaints.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">投诉类别分布</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              投诉量 vs 满载率 vs 延误
            </h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    dataKey="avgLoad"
                    name="平均满载率"
                    unit="%"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    label={{
                      value: "平均满载率 (%)",
                      position: "bottom",
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="avgDelay"
                    name="平均延误"
                    unit="分钟"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    label={{
                      value: "平均延误 (分钟)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#6b7280",
                      fontSize: 12,
                    }}
                  />
                  <ZAxis
                    type="number"
                    dataKey="complaints"
                    range={[50, 400]}
                    name="投诉数"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold text-gray-900">{data.routeName}</p>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-500">投诉数</span>
                                <span className="font-mono font-bold text-red-600">
                                  {data.complaints}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-500">满载率</span>
                                <span className="font-mono">{data.avgLoad}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-500">平均延误</span>
                                <span className="font-mono">{data.avgDelay}分钟</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="线路" data={scatterData} fill="#3b82f6">
                    {scatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={routes.find((r) => r.id === entry.routeId)?.color || "#3b82f6"}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">投诉明细</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">线路</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">站点</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">类别</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">描述</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredComplaints.slice(0, 10).map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(complaint.timestamp).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {complaint.routeName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {complaint.stationName || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        complaint.category === "crowding"
                          ? "bg-red-100 text-red-700"
                          : complaint.category === "delay"
                            ? "bg-amber-100 text-amber-700"
                            : complaint.category === "driver"
                              ? "bg-purple-100 text-purple-700"
                              : complaint.category === "vehicle"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {categoryLabels[complaint.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {complaint.description}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusLabels[complaint.status].color
                      }`}
                    >
                      {statusLabels[complaint.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredComplaints.length > 10 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            显示前 10 条，共 {filteredComplaints.length} 条记录
          </div>
        )}
      </div>
    </div>
  );
}
