import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useAppStore } from "@/store";
import type { ChannelMetrics } from "@/types";

const stageOrder = ["posted", "applied", "screened", "interviewed", "offered", "hired"];
const stageLabels: Record<string, string> = {
  posted: "发布",
  applied: "简历",
  screened: "初筛",
  interviewed: "面试",
  offered: "Offer",
  hired: "入职",
};

function getColorForValue(value: number, maxVal: number): string {
  if (maxVal === 0) return "rgba(0, 229, 204, 0.1)";
  const ratio = Math.min(value / maxVal, 1);
  const r = Math.round(0 + ratio * 255);
  const g = Math.round(229 - ratio * 160);
  const b = Math.round(204 - ratio * 169);
  return `rgba(${r}, ${g}, ${b}, ${0.3 + ratio * 0.6})`;
}

interface TooltipInfo {
  channel: string;
  stage: string;
  value: number;
  x: number;
  y: number;
}

export default function ChannelHeatmap() {
  const { filters } = useAppStore();
  const { data, loading } = useApi<ChannelMetrics[]>("/channels", filters);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  if (loading) {
    return (
      <div className="glass-card p-6 h-72">
        <div className="skeleton h-6 w-36 mb-4" />
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="skeleton h-8" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const channels = data.map((d) => d.channel);
  const allValues: number[] = [];
  data.forEach((ch) => {
    stageOrder.forEach((s) => {
      const v = ch.stageTimings[s];
      if (v !== undefined) allValues.push(v);
    });
  });
  const maxVal = Math.max(...allValues, 1);

  const cellW = 70;
  const cellH = 36;
  const labelW = 64;
  const headerH = 28;
  const svgW = labelW + stageOrder.length * cellW + 20;
  const svgH = headerH + channels.length * cellH + 20;

  return (
    <div className="glass-card glass-card-hover p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-white mb-4">渠道阶段耗时热力图</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[480px]">
          {stageOrder.map((stage, j) => (
            <text
              key={stage}
              x={labelW + j * cellW + cellW / 2}
              y={16}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={11}
            >
              {stageLabels[stage]}
            </text>
          ))}

          {channels.map((channel, i) => (
            <g key={channel}>
              <text
                x={labelW - 6}
                y={headerH + i * cellH + cellH / 2 + 4}
                textAnchor="end"
                fill="#e2e8f0"
                fontSize={11}
              >
                {channel}
              </text>
              {stageOrder.map((stage, j) => {
                const value = data[i].stageTimings[stage] ?? 0;
                const color = getColorForValue(value, maxVal);
                const cx = labelW + j * cellW;
                const cy = headerH + i * cellH;

                return (
                  <g key={`${channel}-${stage}`}>
                    <rect
                      x={cx + 1}
                      y={cy + 1}
                      width={cellW - 2}
                      height={cellH - 2}
                      rx={4}
                      fill={color}
                      className="heatmap-cell cursor-pointer"
                      onMouseEnter={(e) => {
                        const svg = (e.currentTarget as SVGElement).closest("svg");
                        const rect = svg?.getBoundingClientRect();
                        if (rect) {
                          setTooltip({
                            channel,
                            stage: stageLabels[stage],
                            value,
                            x: rect.left + cx + cellW / 2,
                            y: rect.top + cy + cellH / 2,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    <text
                      x={cx + cellW / 2}
                      y={cy + cellH / 2 + 4}
                      textAnchor="middle"
                      fill={value / maxVal > 0.6 ? "#fff" : "#e2e8f0"}
                      fontSize={11}
                      fontFamily="JetBrains Mono"
                      className="pointer-events-none"
                    >
                      {value > 0 ? value.toFixed(1) : "-"}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}

          <defs>
            <linearGradient id="legendGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0, 229, 204, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 107, 53, 0.9)" />
            </linearGradient>
          </defs>
          <rect x={labelW} y={headerH + channels.length * cellH + 8} width={120} height={8} rx={4} fill="url(#legendGrad)" />
          <text x={labelW} y={headerH + channels.length * cellH + 26} fill="#94a3b8" fontSize={9}>0天</text>
          <text x={labelW + 120} y={headerH + channels.length * cellH + 26} fill="#94a3b8" fontSize={9} textAnchor="end">{maxVal.toFixed(0)}天</text>
        </svg>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-secondary-bg/95 backdrop-blur-md border border-accent-cyan/20 rounded-lg p-2.5 shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 8, top: tooltip.y - 30 }}
        >
          <div className="text-xs font-semibold text-accent-cyan">{tooltip.channel} · {tooltip.stage}</div>
          <div className="text-xs text-slate-300 data-font mt-0.5">平均耗时: {tooltip.value.toFixed(1)}天</div>
        </div>
      )}
    </div>
  );
}
