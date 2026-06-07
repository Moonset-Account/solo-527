import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { useApi } from "@/hooks/useApi";
import { useAppStore } from "@/store";

const stageLabels: Record<string, string> = {
  posted: "发布",
  applied: "简历",
  screened: "初筛",
  interviewed: "面试",
  offered: "Offer",
  hired: "入职",
};

const stageColorMap: Record<string, string> = {
  posted: "#00E5CC",
  applied: "#3B82F6",
  screened: "#6366F1",
  interviewed: "#8B5CF6",
  offered: "#F59E0B",
  hired: "#10B981",
};

interface StageDurationRow {
  stage: string;
  stageLabel: string;
  avg: number;
  median: number;
  p90: number;
}

interface ChartRow {
  stage: string;
  avg: number;
  median: number;
  p90: number;
  color: string;
}

export default function StageDurationChart() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<StageDurationRow[]>("/stage-duration", filters);

  if (loading) {
    return (
      <div className="glass-card p-6 h-72">
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-6 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const chartData: ChartRow[] = data.map((s) => ({
    stage: stageLabels[s.stage] || s.stageLabel || s.stage,
    avg: Number((s.avg ?? 0).toFixed(1)),
    median: Number((s.median ?? 0).toFixed(1)),
    p90: Number((s.p90 ?? 0).toFixed(1)),
    color: stageColorMap[s.stage] || "#00E5CC",
  }));

  return (
    <div className="glass-card glass-card-hover p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-white mb-4">阶段耗时分析</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 20, top: 5, bottom: 5 }}>
          <XAxis type="number" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "JetBrains Mono" }} />
          <YAxis dataKey="stage" type="category" stroke="none" tick={{ fill: "#e2e8f0", fontSize: 13 }} width={55} />
          <Tooltip
            contentStyle={{
              background: "rgba(30, 41, 59, 0.95)",
              border: "1px solid rgba(0, 229, 204, 0.2)",
              borderRadius: 8,
              fontFamily: "JetBrains Mono",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value}天`, name]}
            labelFormatter={(label) => `${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
            formatter={(value: string) => <span style={{ color: "#94a3b8" }}>{value}</span>}
          />
          <Bar dataKey="avg" name="平均" radius={[0, 4, 4, 0]} barSize={14}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.9} />
            ))}
          </Bar>
          <Bar dataKey="median" name="中位数" radius={[0, 4, 4, 0]} barSize={14}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.6} />
            ))}
          </Bar>
          <Bar dataKey="p90" name="P90" radius={[0, 4, 4, 0]} barSize={14}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.35} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
