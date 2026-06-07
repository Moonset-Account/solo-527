"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/hooks/use-trpc";
import type { FunnelFilter } from "@/lib/types";
import ReactECharts from "echarts-for-react";

type TrendChartProps = {
  filters: FunnelFilter;
};

export function TrendChart({ filters }: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["trend", filters],
    queryFn: () =>
      trpc.funnel.getTrend.query({ ...filters, granularity: "month" }),
  });

  const option = useMemo(() => {
    if (!data) return {};

    return {
      tooltip: {
        trigger: "axis" as const,
        axisPointer: { type: "cross" as const },
      },
      legend: {
        data: ["候补量", "转正率"],
        bottom: 0,
        textStyle: { fontSize: 12, color: "#6B7B8D" },
      },
      grid: {
        containLabel: true,
        left: 50,
        right: 60,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: "category" as const,
        data: data.map((d) => d.period),
        axisLabel: { fontSize: 12, color: "#6B7B8D" },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#E2E8F0" } },
      },
      yAxis: [
        {
          type: "value" as const,
          name: "候补量",
          nameTextStyle: { fontSize: 12, color: "#6B7B8D" },
          axisLabel: { fontSize: 12, color: "#6B7B8D" },
          splitLine: { lineStyle: { color: "#F0F0F0" } },
        },
        {
          type: "value" as const,
          name: "转正率",
          nameTextStyle: { fontSize: 12, color: "#6B7B8D" },
          axisLabel: {
            fontSize: 12,
            color: "#6B7B8D",
            formatter: (v: number) => `${(v * 100).toFixed(0)}%`,
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "候补量",
          type: "bar" as const,
          yAxisIndex: 0,
          data: data.map((d) => d.waitlistCount),
          itemStyle: {
            color: "rgba(30, 58, 95, 0.6)",
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: 28,
        },
        {
          name: "转正率",
          type: "line" as const,
          yAxisIndex: 1,
          data: data.map((d) => d.conversionRate),
          itemStyle: { color: "#E8A838" },
          lineStyle: { width: 2, color: "#E8A838" },
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          symbol: "circle",
        },
      ],
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
        <div className="h-[350px] bg-bg rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
      <ReactECharts option={option} style={{ height: 350 }} />
    </div>
  );
}
