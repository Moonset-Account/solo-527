import { useMemo } from "react";
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
  ReferenceLine,
} from "recharts";
import type { StrategyBenefitItem } from "~/types";
import { formatNumber } from "~/hooks/useFilterContext";

interface StrategyBenefitsChartProps {
  data: StrategyBenefitItem[];
}

const STRATEGY_COLORS: Record<string, string> = {
  传统漫灌: "#94a3b8",
  喷灌: "#3b82f6",
  滴灌: "#10b981",
  智能灌溉: "#8b5cf6",
};

export default function StrategyBenefitsChart({ data }: StrategyBenefitsChartProps) {
  const chartData = useMemo(() => {
    const byStrategy: Record<string, {
      strategyName: string;
      totalWater: number;
      totalCost: number;
      applicationCount: number;
      avgWaterPerMu: number;
      waterSavingRate: number;
    }> = {};

    data.forEach((item) => {
      if (!byStrategy[item.strategyName]) {
        byStrategy[item.strategyName] = {
          strategyName: item.strategyName,
          totalWater: 0,
          totalCost: 0,
          applicationCount: 0,
          avgWaterPerMu: 0,
          waterSavingRate: 0,
        };
      }
      const s = byStrategy[item.strategyName];
      s.totalWater += item.totalWater;
      s.totalCost += item.totalCost;
      s.applicationCount += item.applicationCount;
    });

    const baseline = byStrategy["传统漫灌"]?.avgWaterPerMu || data.find(d => d.strategyName === "传统漫灌")?.waterPerMu || 10;

    Object.values(byStrategy).forEach((s) => {
      const strategyData = data.filter((d) => d.strategyName === s.strategyName);
      if (strategyData.length > 0) {
        s.avgWaterPerMu = strategyData.reduce((sum, d) => sum + d.waterPerMu, 0) / strategyData.length;
        s.waterSavingRate = baseline > 0 ? Math.max(0, ((baseline - s.avgWaterPerMu) / baseline) * 100) : 0;
      }
    });

    return Object.values(byStrategy);
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">灌溉策略收益对比</h3>
          <p className="text-sm text-gray-500 mt-1">
            以传统漫灌为基准，对比各策略的节水效果
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="strategyName"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "用水量 (m³/亩)", angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "节水率 (%)", angle: 90, position: "insideRight", fontSize: 12, fill: "#6b7280" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                      <p className="font-medium text-gray-800 mb-2">{d.strategyName}</p>
                      <p className="text-sm text-gray-600">
                        💧 单位用水量: <span className="font-medium">{formatNumber(d.avgWaterPerMu)} m³/亩</span>
                      </p>
                      <p className="text-sm text-green-600">
                        💰 节水率: <span className="font-medium">{d.waterSavingRate.toFixed(1)}%</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        应用次数: {d.applicationCount} 次
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />

            <Bar
              yAxisId="left"
              dataKey="avgWaterPerMu"
              name="单位用水量"
              radius={[4, 4, 0, 0]}
              barSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STRATEGY_COLORS[entry.strategyName] || `hsl(${index * 90}, 60%, 50%)`}
                />
              ))}
            </Bar>

            <ReferenceLine yAxisId="left" y={chartData.find(d => d.strategyName === "传统漫灌")?.avgWaterPerMu || 0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "基准线", position: "right", fontSize: 11, fill: "#ef4444" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
        {chartData.map((item, idx) => (
          <div key={item.strategyName} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STRATEGY_COLORS[item.strategyName] }}
              />
              <span className="text-sm text-gray-600">{item.strategyName}</span>
            </div>
            <div className={`text-lg font-semibold ${item.waterSavingRate > 0 ? "text-green-600" : "text-gray-800"}`}>
              {item.waterSavingRate > 0 ? `+${item.waterSavingRate.toFixed(1)}%` : "-"}
            </div>
            <div className="text-xs text-gray-500">相比基准节水</div>
          </div>
        ))}
      </div>
    </div>
  );
}
