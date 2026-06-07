"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/hooks/use-trpc";
import type { FunnelFilter } from "@/lib/types";
import { isLowSample } from "@/lib/utils";
import ReactECharts from "echarts-for-react";
import { AlertTriangle } from "lucide-react";

type FunnelChartProps = {
  filters: FunnelFilter;
};

const FUNNEL_COLORS = [
  "#1E3A5F",
  "#2D5A8E",
  "#4A7FB5",
  "#6BA3D6",
  "#8EC0EA",
  "#B5D8F5",
];

const DRILLDOWN_TABS = [
  { key: "campus" as const, label: "校区" },
  { key: "course" as const, label: "课程" },
  { key: "ageGroup" as const, label: "年龄段" },
  { key: "channel" as const, label: "渠道" },
] as const;

type DrilldownDimension = (typeof DRILLDOWN_TABS)[number]["key"];

export function FunnelChart({ filters }: FunnelChartProps) {
  const [activeDimension, setActiveDimension] = useState<DrilldownDimension>("campus");

  const { data, isLoading } = useQuery({
    queryKey: ["funnel", filters],
    queryFn: () => trpc.funnel.getFunnel.query(filters),
  });

  const funnelOption = useMemo(() => {
    if (!data) return {};
    return {
      tooltip: {
        trigger: "item" as const,
        formatter: (params: { name: string; value: number; percent: number }) =>
          `${params.name}<br/>数量: ${params.value}<br/>占比: ${params.percent}%`,
      },
      series: [
        {
          type: "funnel" as const,
          left: "10%",
          top: 20,
          bottom: 20,
          width: "80%",
          height: "70%",
          sort: "descending" as const,
          gap: 4,
          label: {
            show: true,
            position: "inside" as const,
            formatter: (params: { name: string; value: number }) =>
              `${params.name}: ${params.value}`,
            fontSize: 13,
            color: "#fff",
          },
          itemStyle: {
            borderColor: "#fff",
            borderWidth: 1,
          },
          data: data.data.map((item, i) => ({
            name: item.label,
            value: item.count,
            itemStyle: { color: FUNNEL_COLORS[i] ?? FUNNEL_COLORS[FUNNEL_COLORS.length - 1] },
          })),
        },
      ],
    };
  }, [data]);

  const drilldownData = useMemo(() => {
    if (!data) return null;
    return data.drilldown.find((d) => d.dimension === activeDimension) ?? null;
  }, [data, activeDimension]);

  const drilldownOption = useMemo(() => {
    if (!drilldownData) return {};
    return {
      tooltip: { trigger: "axis" as const, axisPointer: { type: "shadow" as const } },
      grid: { left: 120, right: 40, top: 10, bottom: 20 },
      xAxis: { type: "value" as const },
      yAxis: {
        type: "category" as const,
        data: drilldownData.items.map((item) => item.label),
        axisLabel: { fontSize: 12 },
      },
      series: [
        {
          type: "bar" as const,
          data: drilldownData.items.map((item) => {
            const waitlistItem = item.data.find((d) => d.stage === "waitlist");
            return waitlistItem?.count ?? 0;
          }),
          itemStyle: {
            color: "#4A7FB5",
            borderRadius: [0, 4, 4, 0],
          },
          barWidth: 20,
          label: {
            show: true,
            position: "right" as const,
            fontSize: 12,
            color: "#6B7B8D",
          },
        },
      ],
    };
  }, [drilldownData]);

  const hasLowSample = useMemo(() => {
    if (!drilldownData) return false;
    return drilldownData.items.some((item) => {
      const waitlistItem = item.data.find((d) => d.stage === "waitlist");
      return isLowSample(waitlistItem?.count ?? 0);
    });
  }, [drilldownData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
        <div className="h-[420px] bg-bg rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
      <ReactECharts option={funnelOption} style={{ height: 420 }} />

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-text-secondary">下钻维度</span>
          {hasLowSample && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-warning/10 text-warning font-medium">
              <AlertTriangle size={12} />
              低样本量
            </span>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          {DRILLDOWN_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveDimension(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeDimension === tab.key
                  ? "bg-primary text-white"
                  : "bg-bg text-text-secondary hover:bg-primary/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ReactECharts option={drilldownOption} style={{ height: 240 }} />
      </div>
    </div>
  );
}
