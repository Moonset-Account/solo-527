import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useApi } from "@/hooks/useApi";
import { useAppStore } from "@/store";
import type { InterviewerLoad } from "@/types";

export default function FeedbackCompletion() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<InterviewerLoad[]>("/workload", filters);

  if (loading) {
    return (
      <div className="glass-card p-6 h-64">
        <div className="skeleton h-6 w-28 mb-4" />
        <div className="skeleton h-40 w-40 mx-auto rounded-full" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const totalCompleted = data.reduce((sum, d) => sum + Math.round(d.totalSessions * d.feedbackCompletionRate / 100), 0);
  const totalPending = data.reduce((sum, d) => sum + (d.totalSessions - Math.round(d.totalSessions * d.feedbackCompletionRate / 100)), 0);
  const totalSessions = totalCompleted + totalPending;
  const completionRate = totalSessions > 0 ? (totalCompleted / totalSessions) * 100 : 0;

  const pieData = [
    { name: "已完成", value: totalCompleted, color: "#10B981" },
    { name: "待反馈", value: totalPending, color: "#F59E0B" },
  ];

  return (
    <div className="glass-card glass-card-hover p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-white mb-4">评价完成率</h3>
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="data-font text-3xl font-bold text-white">
            {completionRate.toFixed(0)}%
          </span>
          <span className="text-xs text-slate-400 mt-0.5">完成率</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        {pieData.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name}: <span className="data-font text-slate-300">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
