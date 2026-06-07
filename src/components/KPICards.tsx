import { TrendingUp, TrendingDown } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAppStore } from "@/store";
import type { FunnelStage } from "@/types";

export default function KPICards() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<FunnelStage[]>("/funnel", filters);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-5 h-28">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-8 w-32 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const applied = data.find((s) => s.stage === "applied");
  const hired = data.find((s) => s.stage === "hired");
  const overallConversionRate =
    applied && applied.count > 0 && hired
      ? Math.round((hired.count / applied.count) * 10000) / 100
      : 0;

  const avgHiringCycleDays = data.reduce((sum, s) => sum + (s.avgDaysInStage || 0), 0);

  const candidateSatisfaction = 4.2;

  const cards = [
    {
      label: "整体转化率",
      value: `${overallConversionRate.toFixed(1)}%`,
      trend: 2.3,
    },
    {
      label: "平均招聘周期",
      value: `${avgHiringCycleDays.toFixed(1)}天`,
      trend: -1.5,
      invertTrend: true,
    },
    {
      label: "候选人满意度",
      value: candidateSatisfaction.toFixed(1),
      trend: 0.8,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
      {cards.map(({ label, value, trend, invertTrend }) => {
        const isPositive = invertTrend ? trend < 0 : trend > 0;
        return (
          <div
            key={label}
            className="glass-card glass-card-hover p-5 flex flex-col justify-between"
          >
            <div className="text-sm text-slate-400 font-medium">{label}</div>
            <div className="flex items-end justify-between mt-2">
              <span className="data-font text-3xl font-bold text-white">
                {value}
              </span>
              <div
                className={`flex items-center gap-1 text-sm data-font ${
                  isPositive ? "text-success-green" : "text-anomaly-orange"
                }`}
              >
                {isPositive ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
