"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { TimeoutTrendPoint } from "@/types";

interface TimeoutTrendChartProps {
  data: TimeoutTrendPoint[];
}

export function TimeoutTrendChart({ data }: TimeoutTrendChartProps) {
  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },
      legend: {
        data: ["平均等待时长", "超时率"],
        top: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: data.map((d) => d.time),
        axisLabel: {
          fontSize: 10,
          rotate: 30,
        },
      },
      yAxis: [
        {
          type: "value",
          name: "等待时长(秒)",
          position: "left",
          axisLabel: { formatter: "{value}s" },
          splitLine: { lineStyle: { type: "dashed" } },
        },
        {
          type: "value",
          name: "超时率",
          position: "right",
          axisLabel: { formatter: "{value}%" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "平均等待时长",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: data.map((d) => d.avgWaitTime),
          lineStyle: { width: 2, color: "#165DFF" },
          itemStyle: { color: "#165DFF" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(22, 93, 255, 0.3)" },
                { offset: 1, color: "rgba(22, 93, 255, 0.05)" },
              ],
            },
          },
          markLine: {
            silent: true,
            lineStyle: { color: "#F53F3F", type: "dashed" },
            data: [{ yAxis: 45, name: "超时警戒线" }],
            label: { formatter: "警戒线: 45s" },
          },
        },
        {
          name: "超时率",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "diamond",
          symbolSize: 6,
          data: data.map((d) => (d.timeoutRate * 100).toFixed(1)),
          lineStyle: { width: 2, color: "#FF7D00" },
          itemStyle: { color: "#FF7D00" },
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
