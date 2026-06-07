"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { TeamWorkload } from "@/types";

interface WorkloadHeatmapProps {
  data: TeamWorkload[];
}

export function WorkloadHeatmap({ data }: WorkloadHeatmapProps) {
  const option = useMemo(() => {
    const hours = Array.from(new Set(data.map((d) => d.hour))).sort((a, b) => a - b);
    const teams = Array.from(new Set(data.map((d) => d.teamName)));

    const heatmapData = data.map((d) => [
      teams.indexOf(d.teamName),
      hours.indexOf(d.hour),
      d.workload,
      d.avgWaitTime,
      d.sessionCount,
    ]);

    return {
      tooltip: {
        position: "top",
        formatter: (params: any) => {
          const [teamIdx, hourIdx, workload, waitTime, sessionCount] = params.value;
          return `
            <div class="p-2">
              <div class="font-medium mb-1">${teams[teamIdx]}</div>
              <div class="text-sm text-neutral-500">时段: ${hours[hourIdx]}:00-${hours[hourIdx] + 1}:00</div>
              <div class="text-sm">负载率: <span class="font-medium">${workload}%</span></div>
              <div class="text-sm">平均等待: ${waitTime}秒</div>
              <div class="text-sm">会话量: ${sessionCount}</div>
            </div>
          `;
        },
      },
      grid: {
        left: "10%",
        right: "5%",
        top: "5%",
        bottom: "10%",
      },
      xAxis: {
        type: "category",
        data: hours.map((h) => `${h}:00`),
        splitArea: { show: true },
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "category",
        data: teams,
        splitArea: { show: true },
        axisLabel: { fontSize: 12 },
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "0%",
        inRange: {
          color: ["#00B42A", "#165DFF", "#FF7D00", "#F53F3F"],
        },
        textStyle: { fontSize: 11 },
      },
      series: [
        {
          name: "班组负载",
          type: "heatmap",
          data: heatmapData,
          label: {
            show: true,
            formatter: (params: any) => `${params.value[2]}%`,
            fontSize: 10,
            color: "#fff",
            textBorderColor: "rgba(0,0,0,0.3)",
            textBorderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
        },
      ],
    };
  }, [data]);

  return (
    <ReactECharts
      option={option}
      style={{ height: "400px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
