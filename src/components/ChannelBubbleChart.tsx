import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from "recharts";
import { useApi } from "@/hooks/useApi";
import { useAppStore } from "@/store";
import type { ChannelMetrics } from "@/types";

const channelColors: Record<string, string> = {
  "猎聘": "#00E5CC",
  "BOSS直聘": "#3B82F6",
  "内推": "#10B981",
  "官网": "#6366F1",
  "拉勾": "#F59E0B",
  "猎头": "#FF6B35",
};

interface ChartRow {
  channel: string;
  costPerHire: number;
  conversionRate: number;
  totalApplied: number;
}

export default function ChannelBubbleChart() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<ChannelMetrics[]>("/channels", filters);

  if (loading) {
    return (
      <div className="glass-card p-6 h-72">
        <div className="skeleton h-6 w-36 mb-4" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const chartData: ChartRow[] = data.map((ch) => ({
    channel: ch.channel,
    costPerHire: Number(ch.costPerHire.toFixed(0)),
    conversionRate: Number(ch.conversionRate.toFixed(1)),
    totalApplied: ch.totalApplied,
  }));

  return (
    <div className="glass-card glass-card-hover p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-white mb-4">渠道成本效率</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
          <XAxis
            type="number"
            dataKey="costPerHire"
            name="单聘成本"
            unit="元"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "JetBrains Mono" }}
            label={{ value: "单聘成本 (元)", position: "bottom", fill: "#94a3b8", fontSize: 11, offset: -2 }}
          />
          <YAxis
            type="number"
            dataKey="conversionRate"
            name="转化率"
            unit="%"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "JetBrains Mono" }}
            label={{ value: "转化率 (%)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
          />
          <ZAxis type="number" dataKey="totalApplied" range={[100, 800]} />
          <Tooltip
            contentStyle={{
              background: "rgba(30, 41, 59, 0.95)",
              border: "1px solid rgba(0, 229, 204, 0.2)",
              borderRadius: 8,
              fontFamily: "JetBrains Mono",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === "转化率") return [`${value}%`, name];
              if (name === "单聘成本") return [`${value}元`, name];
              return [value, name];
            }}
            labelFormatter={() => ""}
          />
          <Scatter data={chartData} name="渠道">
            {chartData.map((entry, i) => (
              <Cell key={i} fill={channelColors[entry.channel] || "#00E5CC"} fillOpacity={0.7} stroke={channelColors[entry.channel] || "#00E5CC"} strokeWidth={1.5} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {chartData.map((d) => (
          <div key={d.channel} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: channelColors[d.channel] || "#00E5CC" }}
            />
            {d.channel}
          </div>
        ))}
      </div>
    </div>
  );
}
