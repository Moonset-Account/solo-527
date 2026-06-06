"use client";

import { useMemo, useState } from "react";
import {
  getArrivalRecords,
  getCardRecords,
  getComplaints,
  getTrips,
  calculateComparisonMetrics,
  getRoutes,
} from "@/lib/dataStore";
import KPICard from "./KPICard";
import CrowdingMap from "./CrowdingMap";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function OverviewDashboard() {
  const [selectedHour, setSelectedHour] = useState<number | undefined>();
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();

  const routes = getRoutes();
  const allArrivals = getArrivalRecords();
  const regularArrivals = getArrivalRecords(undefined, undefined, undefined, false);
  const cardRecords = getCardRecords();
  const complaints = getComplaints();
  const trips = getTrips();

  const kpis = useMemo(() => {
    const totalPassengers = allArrivals.reduce(
      (sum, a) => sum + a.passengerCount,
      0
    );

    const onTimeCount = regularArrivals.filter((a) => a.delaySeconds <= 120).length;
    const onTimeRate =
      regularArrivals.length > 0
        ? (onTimeCount / regularArrivals.length) * 100
        : 0;

    const avgLoadFactor =
      allArrivals.length > 0
        ? allArrivals.reduce((sum, a) => sum + a.loadFactor, 0) / allArrivals.length
        : 0;

    const detourTrips = trips.filter((t) => t.isDetour).length;

    return {
      totalPassengers,
      onTimeRate: Number(onTimeRate.toFixed(1)),
      avgLoadFactor: Number((avgLoadFactor * 100).toFixed(1)),
      complaintCount: complaints.length,
      detourTrips,
      totalTrips: trips.length,
    };
  }, [allArrivals, regularArrivals, complaints, trips]);

  const hourlyData = useMemo(() => {
    const hours: Record<
      number,
      {
        passengers: number;
        arrivals: number;
        avgLoad: number;
        complaints: number;
      }
    > = {};

    for (let h = 6; h <= 22; h++) {
      hours[h] = { passengers: 0, arrivals: 0, avgLoad: 0, complaints: 0 };
    }

    allArrivals.forEach((a) => {
      const h = new Date(a.timestamp).getHours();
      if (hours[h]) {
        hours[h].passengers += a.passengerCount;
        hours[h].arrivals += 1;
        hours[h].avgLoad += a.loadFactor;
      }
    });

    complaints.forEach((c) => {
      const h = new Date(c.timestamp).getHours();
      if (hours[h]) {
        hours[h].complaints += 1;
      }
    });

    return Object.entries(hours).map(([hour, data]) => ({
      hour: `${hour}:00`,
      hourNum: parseInt(hour),
      passengers: data.passengers,
      arrivals: data.arrivals,
      avgLoad: data.arrivals > 0 ? Number(((data.avgLoad / data.arrivals) * 100).toFixed(1)) : 0,
      complaints: data.complaints,
    }));
  }, [allArrivals, complaints]);

  const routeMetrics = useMemo(() => {
    return calculateComparisonMetrics(routes.map((r) => r.id));
  }, [routes]);

  const crowdingDistribution = useMemo(() => {
    const levels: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      extreme: 0,
    };
    allArrivals.forEach((a) => {
      levels[a.crowdingLevel] = (levels[a.crowdingLevel] || 0) + 1;
    });
    return [
      { name: "宽松", value: levels.low, color: "#10b981" },
      { name: "适中", value: levels.medium, color: "#f59e0b" },
      { name: "拥挤", value: levels.high, color: "#ef4444" },
      { name: "极度拥挤", value: levels.extreme, color: "#7c2d12" },
    ];
  }, [allArrivals]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="今日客流量"
          value={kpis.totalPassengers.toLocaleString()}
          unit="人次"
          icon="passengers"
          change={5.2}
          trend="up"
        />
        <KPICard
          title="准点率"
          value={kpis.onTimeRate}
          unit="%"
          icon="ontime"
          change={-1.3}
          trend="down"
          warning={kpis.onTimeRate < 90}
        />
        <KPICard
          title="平均满载率"
          value={kpis.avgLoadFactor}
          unit="%"
          icon="load"
          change={2.1}
          trend="up"
        />
        <KPICard
          title="投诉数量"
          value={kpis.complaintCount}
          unit="件"
          icon="complaints"
          change={-8.5}
          trend="down"
        />
        <KPICard
          title="临时绕行班次"
          value={kpis.detourTrips}
          unit="班"
          icon="delay"
          warning={kpis.detourTrips > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">实时拥挤地图</h3>
          <div className="h-[500px]">
            <CrowdingMap
              selectedHour={selectedHour}
              selectedRouteId={selectedRouteId}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">拥挤度分布</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={crowdingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {crowdingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {crowdingDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">线路排行</h3>
            <div className="space-y-3">
              {routeMetrics
                .sort((a, b) => b.avgLoadFactor - a.avgLoadFactor)
                .slice(0, 4)
                .map((metric, index) => {
                  const route = routes.find((r) => r.id === metric.routeId);
                  return (
                    <div key={metric.routeId} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0
                            ? "bg-amber-500"
                            : index === 1
                              ? "bg-gray-400"
                              : index === 2
                                ? "bg-orange-400"
                                : "bg-gray-300"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {metric.routeName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {(metric.avgLoadFactor * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${metric.avgLoadFactor * 100}%`,
                              backgroundColor: route?.color || "#3b82f6",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">24小时客流趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPassengers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  tickFormatter={(v) => v}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  label={{
                    value: "客流 (人次)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#6b7280",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="passengers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPassengers)"
                  name="客流量"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">满载率 & 投诉趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourlyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  label={{
                    value: "满载率 (%)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#6b7280",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  label={{
                    value: "投诉数",
                    angle: 90,
                    position: "insideRight",
                    fill: "#6b7280",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="avgLoad"
                  name="平均满载率"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="complaints"
                  name="投诉数"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
