"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
  Thermometer,
  Droplets,
  Wind,
} from "lucide-react";
import { getWeatherRecords, getArrivalRecords } from "@/lib/dataStore";

const weatherIcons: Record<string, any> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  snowy: Snowflake,
};

const weatherLabels: Record<string, string> = {
  sunny: "晴",
  cloudy: "多云",
  rainy: "雨",
  stormy: "暴雨",
  snowy: "雪",
};

export default function WeatherImpact() {
  const weatherRecords = getWeatherRecords();

  const chartData = useMemo(() => {
    return weatherRecords.map((w) => {
      const hourArrivals = getArrivalRecords().filter((a) => {
        const h = new Date(a.timestamp).getHours();
        return h === w.hour;
      });

      const avgDelay =
        hourArrivals.length > 0
          ? hourArrivals.reduce((sum, a) => sum + a.delaySeconds, 0) /
            hourArrivals.length /
            60
          : 0;

      const avgLoad =
        hourArrivals.length > 0
          ? hourArrivals.reduce((sum, a) => sum + a.loadFactor, 0) /
            hourArrivals.length
          : 0;

      return {
        hour: `${w.hour}:00`,
        hourNum: w.hour,
        temperature: w.temperature,
        precipitation: w.precipitation,
        windSpeed: w.windSpeed,
        visibility: w.visibility,
        condition: w.condition,
        avgDelay: Number(avgDelay.toFixed(1)),
        avgLoad: Number((avgLoad * 100).toFixed(1)),
      };
    });
  }, [weatherRecords]);

  const currentWeather = weatherRecords.find(
    (w) => w.hour === new Date().getHours()
  ) || weatherRecords[12];
  const CurrentWeatherIcon = weatherIcons[currentWeather.condition];

  const impactAnalysis = useMemo(() => {
    const badWeather = ["rainy", "stormy", "snowy"];
    const badWeatherHours = weatherRecords.filter((w) =>
      badWeather.includes(w.condition)
    );
    const goodWeatherHours = weatherRecords.filter(
      (w) => !badWeather.includes(w.condition)
    );

    const getMetrics = (hours: typeof weatherRecords) => {
      const allArrivals = hours.flatMap((h) =>
        getArrivalRecords().filter((a) => {
          const hour = new Date(a.timestamp).getHours();
          return hour === h.hour;
        })
      );
      if (allArrivals.length === 0) return { avgDelay: 0, onTimeRate: 0, avgLoad: 0 };

      const avgDelay =
        allArrivals.reduce((sum, a) => sum + a.delaySeconds, 0) /
        allArrivals.length /
        60;
      const onTimeCount = allArrivals.filter((a) => a.delaySeconds <= 120).length;
      const onTimeRate = (onTimeCount / allArrivals.length) * 100;
      const avgLoad =
        allArrivals.reduce((sum, a) => sum + a.loadFactor, 0) / allArrivals.length;

      return {
        avgDelay: Number(avgDelay.toFixed(1)),
        onTimeRate: Number(onTimeRate.toFixed(1)),
        avgLoad: Number((avgLoad * 100).toFixed(1)),
      };
    };

    return {
      badWeather: getMetrics(badWeatherHours),
      goodWeather: getMetrics(goodWeatherHours),
    };
  }, [weatherRecords]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">天气影响分析</h3>
            <p className="text-sm text-gray-500 mt-1">
              分析天气条件对公交运营的影响
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <CurrentWeatherIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">当前天气</p>
                <p className="text-2xl font-bold text-gray-900">
                  {weatherLabels[currentWeather.condition]}
                </p>
                <p className="text-sm text-gray-500">
                  {currentWeather.temperature}°C
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
            <h4 className="text-sm font-medium text-amber-800 mb-3">恶劣天气影响</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">平均延误</span>
                <span className="font-bold text-amber-700">
                  {impactAnalysis.badWeather.avgDelay} 分钟
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">准点率</span>
                <span className="font-bold text-amber-700">
                  {impactAnalysis.badWeather.onTimeRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-3">良好天气对比</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">平均延误</span>
                <span className="font-bold text-green-700">
                  {impactAnalysis.goodWeather.avgDelay} 分钟
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">准点率</span>
                <span className="font-bold text-green-700">
                  {impactAnalysis.goodWeather.onTimeRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              温度、降水 vs 平均延误
            </h4>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(v) => v}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    label={{
                      value: "温度 (°C) / 降水 (mm)",
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
                      value: "平均延误 (分钟)",
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
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    name="温度"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="precipitation"
                    name="降水量"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgDelay"
                    name="平均延误"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              各时段满载率
            </h4>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    label={{
                      value: "满载率 (%)",
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
                  <Legend />
                  <Bar dataKey="avgLoad" name="平均满载率" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => {
                      let color = "#8b5cf6";
                      if (entry.avgLoad >= 70) color = "#ef4444";
                      else if (entry.avgLoad >= 50) color = "#f59e0b";
                      else color = "#10b981";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600">平均温度</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {(
                weatherRecords.reduce((sum, w) => sum + w.temperature, 0) /
                weatherRecords.length
              ).toFixed(1)}
              °C
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">总降水量</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {weatherRecords.reduce((sum, w) => sum + w.precipitation, 0).toFixed(1)}mm
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-4 h-4 text-teal-500" />
              <span className="text-sm text-gray-600">平均风速</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {(
                weatherRecords.reduce((sum, w) => sum + w.windSpeed, 0) /
                weatherRecords.length
              ).toFixed(1)}
              m/s
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">能见度</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {(
                weatherRecords.reduce((sum, w) => sum + w.visibility, 0) /
                weatherRecords.length
              ).toFixed(1)}
              km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
