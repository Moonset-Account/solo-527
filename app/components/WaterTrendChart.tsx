import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { WaterTrendItem } from "~/types";
import { formatNumber, formatDate } from "~/hooks/useFilterContext";

interface WaterTrendChartProps {
  data: WaterTrendItem[];
}

export default function WaterTrendChart({ data }: WaterTrendChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    displayDate: formatDate(item.date).slice(5),
  }));

  const maxRainfall = Math.max(...data.map((d) => d.rainfall), 1);
  const maxWater = Math.max(...data.map((d) => d.totalWater), 1);
  const rainScale = maxWater / (maxRainfall * 2);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">水耗趋势</h3>
          <p className="text-sm text-gray-500 mt-1">
            每日灌溉水量变化，标注降雨后灌溉情况
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">常规灌溉</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-gray-600">雨后灌溉</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-gray-400 border-t-2 border-dashed" />
            <span className="text-gray-600">降雨量</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "水量 (m³)", angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "降雨 (mm)", angle: 90, position: "insideRight", fontSize: 12, fill: "#6b7280" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                      <p className="font-medium text-gray-800 mb-2">{data.date}</p>
                      <p className="text-sm text-gray-600">
                        💧 总水量: <span className="font-medium">{formatNumber(data.totalWater)} m³</span>
                      </p>
                      {data.postRainWater > 0 && (
                        <p className="text-sm text-purple-600">
                          🌧️ 雨后灌溉: <span className="font-medium">{formatNumber(data.postRainWater)} m³</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        ⚡ 电费: <span className="font-medium">{formatNumber(data.totalCost)} 元</span>
                      </p>
                      {data.rainfall > 0 && (
                        <p className="text-sm text-blue-600">
                          ☔ 降雨量: <span className="font-medium">{formatNumber(data.rainfall, 1)} mm</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        次数: {data.irrigationCount} 次
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="normalWater"
              name="常规灌溉"
              stackId="water"
              fill="#3b82f6"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="postRainWater"
              name="雨后灌溉"
              stackId="water"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rainfall"
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="降雨量"
            />
            {chartData.map(
              (entry, index) =>
                entry.hasRain && (
                  <ReferenceLine
                    key={`rain-${index}`}
                    x={entry.displayDate}
                    yAxisId="left"
                    stroke="#60a5fa"
                    strokeOpacity={0.3}
                    strokeWidth={20}
                  />
                )
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          共 <span className="font-medium text-gray-700">{data.length}</span> 天数据
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-200" />
            <span className="text-gray-500">降雨日背景高亮</span>
          </div>
        </div>
      </div>
    </div>
  );
}
