import { useApi } from "@/hooks/useApi";
import { useAppStore } from "@/store";
import type { InterviewerLoad } from "@/types";

const weekLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export default function WorkloadTimeline() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<InterviewerLoad[]>("/workload", filters);

  if (loading) {
    return (
      <div className="glass-card p-6 h-64">
        <div className="skeleton h-6 w-36 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const maxSessions = Math.max(...data.flatMap((d) => d.weeklySessions), 1);

  return (
    <div className="glass-card glass-card-hover p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-white mb-4">周面试时间线</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-16" />
          {weekLabels.map((d) => (
            <div key={d} className="flex-1 text-center text-xs text-slate-500">
              {d}
            </div>
          ))}
        </div>
        {data.map((interviewer) => (
          <div key={interviewer.interviewerId} className="flex items-center gap-2">
            <div className="w-16 text-xs text-slate-300 truncate">
              {interviewer.interviewerName}
            </div>
            <div className="flex-1 flex gap-1">
              {interviewer.weeklySessions.map((count, j) => {
                const ratio = count / maxSessions;
                return (
                  <div
                    key={j}
                    className="flex-1 flex flex-col items-center justify-end"
                    style={{ height: 40 }}
                  >
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${Math.max(ratio * 100, 4)}%`,
                        backgroundColor: ratio > 0.7 ? "#FF6B35" : ratio > 0.4 ? "#3B82F6" : "#00E5CC",
                        opacity: 0.7 + ratio * 0.3,
                      }}
                    />
                    {count > 0 && (
                      <span className="data-font text-[9px] text-slate-400 mt-0.5">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-accent-cyan" />
          低负载
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-secondaryAccent-blue" />
          中负载
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-anomaly-orange" />
          高负载
        </div>
      </div>
    </div>
  );
}
