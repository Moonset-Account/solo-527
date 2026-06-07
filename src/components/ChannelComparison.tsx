import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApi } from "@/hooks/useApi";
import { useAppStore } from "@/store";
import type { ChannelMetrics } from "@/types";

export default function ChannelComparison() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<ChannelMetrics[]>("/channels", filters);

  if (loading) {
    return (
      <div className="glass-card p-6 h-80">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="skeleton h-56 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const chartData = data.map((ch) => ({
    channel: ch.channel,
    申请量: ch.totalApplied,
    转化率: Number(ch.conversionRate.toFixed(1)),
    平均周期: ch.avgTimeToHire,
    满意度: ch.avgSatisfaction || ch.satisfactionScore,
  }));

  return (
    <div className="glass-card glass-card-hover p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-white mb-4">渠道质量对比</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <XAxis dataKey="channel" stroke="#64748b" tick={{ fill: "#e2e8f0", fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "JetBrains Mono" }} />
          <Tooltip
            contentStyle={{
              background: "rgba(30, 41, 59, 0.95)",
              border: "1px solid rgba(0, 229, 204, 0.2)",
              borderRadius: 8,
              fontFamily: "JetBrains Mono",
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => <span style={{ color: "#94a3b8" }}>{value}</span>}
          />
          <Bar dataKey="申请量" fill="#00E5CC" radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="转化率" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="平均周期" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="满意度" fill="#10B981" radius={[4, 4, 0, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
