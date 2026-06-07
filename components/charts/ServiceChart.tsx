"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ServiceMetrics } from "@/lib/types";

interface Props {
  data: ServiceMetrics | null;
  loading?: boolean;
  height?: number;
}

export default function ServiceChart({ data, loading, height = 380 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    if (!data) {
      chart.setOption({
        title: {
          text: loading ? "加载中..." : "暂无数据",
          left: "center",
          top: "center",
          textStyle: { color: "#94a3b8", fontSize: 14 },
        },
      });
      return;
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = params[0];
          return `
            <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
            <div>工单数: <b>${p.value}</b></div>
          `;
        },
      },
      legend: {
        data: ["处理时长分布", "客服人均效率"],
        top: 0,
        right: 0,
        textStyle: { fontSize: 11, color: "#64748b" },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "8%",
        top: "15%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          data: data.distribution.map((d) => d.range),
          axisLabel: { fontSize: 10, color: "#64748b", rotate: 30 },
          axisLine: { lineStyle: { color: "#e2e8f0" } },
          axisTick: { show: false },
        },
      ],
      yAxis: [
        {
          type: "value",
          name: "工单数量",
          nameTextStyle: { fontSize: 10, color: "#64748b" },
          axisLabel: { fontSize: 11, color: "#64748b" },
          splitLine: { lineStyle: { color: "#f1f5f9" } },
        },
        {
          type: "value",
          name: "平均时长(分钟)",
          nameTextStyle: { fontSize: 10, color: "#64748b" },
          axisLabel: { fontSize: 11, color: "#64748b" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "处理时长分布",
          type: "bar",
          data: data.distribution.map((d) => d.count),
          barWidth: "45%",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#10b981" },
              { offset: 1, color: "#059669" },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: "客服人均效率",
          type: "line",
          yAxisIndex: 1,
          data: data.agentRanking.slice(0, 6).map((a) => a.avgTime),
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#f59e0b", width: 2 },
          itemStyle: { color: "#f59e0b" },
        },
      ],
      animationDuration: 600,
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, loading]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
