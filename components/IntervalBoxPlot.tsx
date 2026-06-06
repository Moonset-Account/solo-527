"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getArrivalIntervalData, getRoutes, getStations } from "@/lib/dataStore";

interface BoxPlotData {
  hour: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export default function IntervalBoxPlot() {
  const [selectedRouteId, setSelectedRouteId] = useState(getRoutes()[0]?.id || "");
  const [selectedStationId, setSelectedStationId] = useState("");

  const routes = getRoutes();
  const stations = useMemo(() => {
    const route = routes.find((r) => r.id === selectedRouteId);
    return route?.stations || [];
  }, [selectedRouteId, routes]);

  const chartData = useMemo(() => {
    if (!selectedRouteId || !selectedStationId) return [];
    const data = getArrivalIntervalData(selectedRouteId, selectedStationId);
    return data.map((d) => ({
      hour: d.hour,
      min: d.min,
      q1: d.q1,
      median: d.median,
      q3: d.q3,
      max: d.max,
      iqr: d.q3 - d.q1,
    }));
  }, [selectedRouteId, selectedStationId]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.hour}:00 - {data.hour + 1}:00</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">最 小 值</span>
              <span className="font-mono">{data.min.toFixed(1)} 分钟</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">下四分位</span>
              <span className="font-mono">{data.q1.toFixed(1)} 分钟</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">中 位 数</span>
              <span className="font-mono font-bold text-blue-600">{data.median.toFixed(1)} 分钟</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">上四分位</span>
              <span className="font-mono">{data.q3.toFixed(1)} 分钟</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">最 大 值</span>
              <span className="font-mono">{data.max.toFixed(1)} 分钟</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (value: number) => {
    if (value > 15) return "#ef4444";
    if (value > 10) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">到站间隔箱线图</h3>
          <p className="text-sm text-gray-500 mt-1">
            按小时统计的到站发车间隔分布，反映班次稳定性
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">选择线路</label>
            <select
              value={selectedRouteId}
              onChange={(e) => {
                setSelectedRouteId(e.target.value);
                setSelectedStationId("");
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">选择站点</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择站点</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sequence}. {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedStationId ? (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                tickFormatter={(v) => `${v}:00`}
                fontSize={12}
                tick={{ fill: "#6b7280" }}
              />
              <YAxis
                label={{
                  value: "间隔时间 (分钟)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#6b7280", fontSize: 12 },
                }}
                fontSize={12}
                tick={{ fill: "#6b7280" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              <Bar dataKey="min" name="最小值" stackId="a" fill="#d1fae5" radius={[0, 0, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`min-${index}`} fill="#86efac" />
                ))}
              </Bar>
              <Bar dataKey="iqr" name="IQR区间" stackId="a">
                {chartData.map((entry, index) => (
                  <Cell key={`iqr-${index}`} fill={getBarColor(entry.median)} />
                ))}
              </Bar>
              <Bar dataKey="median" name="中位数" stackId="b" fill="#1e40af" barSize={4}>
                {chartData.map((entry, index) => (
                  <Cell key={`med-${index}`} fill="#1e40af" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[400px] flex items-center justify-center text-gray-400">
          请选择线路和站点查看数据
        </div>
      )}

      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-300" />
          <span className="text-gray-600">稳定 (&lt;10分钟)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span className="text-gray-600">一般 (10-15分钟)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-gray-600">不稳定 (&gt;15分钟)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded bg-blue-900" />
          <span className="text-gray-600">中位数</span>
        </div>
      </div>
    </div>
  );
}
