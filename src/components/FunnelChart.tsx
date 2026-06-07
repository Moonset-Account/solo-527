import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAppStore } from "@/store";
import type { FunnelStage } from "@/types";

const stageLabels: Record<string, string> = {
  posted: "发布",
  applied: "简历",
  screened: "初筛",
  interviewed: "面试",
  offered: "Offer",
  hired: "入职",
};

const stageColors = [
  "#00E5CC",
  "#00CDB8",
  "#00B5A2",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
];

interface TooltipData {
  stage: string;
  count: number;
  rate: number;
  avgDays: number;
  medianDays: number;
  p90Days: number;
  x: number;
  y: number;
}

export default function FunnelChart() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<FunnelStage[]>("/funnel", filters);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  if (loading) {
    return (
      <div className="glass-card p-6 h-96">
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="flex flex-col items-center gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-10 w-full" style={{ maxWidth: `${100 - i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 400;
  const padding = { top: 30, right: 40, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const stageH = chartH / data.length;

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="glass-card glass-card-hover p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-white mb-4">招聘漏斗</h3>
      <div className="relative flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-2xl"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            {stageColors.map((color, i) => (
              <linearGradient key={i} id={`funnelGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                <stop offset="100%" stopColor={color} stopOpacity={0.55} />
              </linearGradient>
            ))}
          </defs>

          {data.map((stage, i) => {
            const topWidth = (stage.count / maxCount) * chartW;
            const nextStage = data[i + 1];
            const bottomWidth = nextStage
              ? (nextStage.count / maxCount) * chartW
              : topWidth * 0.5;

            const y = padding.top + i * stageH;
            const topX = padding.left + (chartW - topWidth) / 2;
            const bottomX = padding.left + (chartW - bottomWidth) / 2;

            return (
              <g key={stage.stage} className="funnel-animate" style={{ animationDelay: `${i * 0.1}s` }}>
                <polygon
                  points={`${topX},${y} ${topX + topWidth},${y} ${bottomX + bottomWidth},${y + stageH} ${bottomX},${y + stageH}`}
                  fill={`url(#funnelGrad${i})`}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as SVGElement).closest("svg")?.getBoundingClientRect();
                    if (rect) {
                      setTooltip({
                        stage: stageLabels[stage.stage] || stage.stage,
                        count: stage.count,
                        rate: stage.conversionRate,
                        avgDays: stage.avgDaysInStage,
                        medianDays: stage.medianDaysInStage,
                        p90Days: stage.p90DaysInStage,
                        x: rect.left + rect.width / 2,
                        y: rect.top + y + stageH / 2,
                      });
                    }
                  }}
                />
                <text
                  x={width / 2}
                  y={y + stageH / 2 - 4}
                  textAnchor="middle"
                  className="data-font fill-white text-sm font-semibold pointer-events-none"
                  fontSize="13"
                >
                  {stage.count.toLocaleString()}
                </text>
                <text
                  x={width / 2}
                  y={y + stageH / 2 + 12}
                  textAnchor="middle"
                  className="fill-slate-300 text-xs pointer-events-none"
                  fontSize="11"
                >
                  {stageLabels[stage.stage]}
                </text>

                {nextStage && (
                  <g>
                    <text
                      x={width - padding.right + 8}
                      y={y + stageH / 2 + 4}
                      textAnchor="start"
                      className="data-font fill-accent-cyan text-xs"
                      fontSize="11"
                    >
                      {stage.conversionRate.toFixed(1)}%
                    </text>
                    <line
                      x1={topX + topWidth + 4}
                      y1={y + stageH / 2}
                      x2={width - padding.right + 4}
                      y2={y + stageH / 2}
                      stroke="#00E5CC"
                      strokeWidth={0.5}
                      strokeDasharray="3,3"
                      className="pointer-events-none"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {tooltip && (
          <div
            className="fixed z-50 bg-secondary-bg/95 backdrop-blur-md border border-accent-cyan/20 rounded-lg p-3 shadow-xl pointer-events-none"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 40,
            }}
          >
            <div className="text-sm font-semibold text-accent-cyan mb-1">{tooltip.stage}</div>
            <div className="text-xs text-slate-300 space-y-0.5 data-font">
              <div>数量: {tooltip.count.toLocaleString()}</div>
              <div>转化率: {tooltip.rate.toFixed(1)}%</div>
              <div>平均耗时: {tooltip.avgDays.toFixed(1)}天</div>
              <div>中位数: {tooltip.medianDays.toFixed(1)}天</div>
              <div>P90: {tooltip.p90Days.toFixed(1)}天</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
