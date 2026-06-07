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
import type { InterviewerLoad } from "@/types";

export default function WorkloadDistribution() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<InterviewerLoad[]>("/workload", filters);

  if (loading) {
    return (
      <div className="glass-card p-6 h-80">
        <div className="skeleton h-6 w-36 mb-4" />
        <div className="skeleton h-56 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const chartData = data.map((w) => {
    const completed = Math.round(w.totalSessions * w.feedbackCompletionRate / 100);
    const pending = w.totalSessions - completed;
    return {
      name: w.interviewerName,
      已完成: completed,
      待反馈: pending,
    };
  });

  return (
    <div className="glass-card glass-card-hover p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-white mb-4">面试官负载分布</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <XAxis
            dataKey="name"
            stroke="#64748b"
            tick={{ fill: "#e2e8f0", fontSize: 12 }}
            angle={-20}
            textAnchor="end"
            height={50}
          />
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
          <Bar dataKey="已完成" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} barSize={28} />
          <Bar dataKey="待反馈" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
