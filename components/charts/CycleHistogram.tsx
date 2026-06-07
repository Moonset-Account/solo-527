"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { CycleDistribution } from "@/lib/types";

interface Props {
  data: CycleDistribution | null;
  loading?: boolean;
  height?: number;
}

export default function CycleHistogram({ data, loading, height = 380 }: Props) {
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

    const total = data.bins.reduce((s, b) => s + b.count, 0);

    const findPercentileBin = (pct: number) => {
      let sum = 0;
      for (let i = 0; i < data.bins.length; i++) {
        sum += data.bins[i].count;
        if (sum >= total * pct) {
          return i;
        }
      }
      return data.bins.length - 1;
    };

    const p50Idx = findPercentileBin(0.5);
    const p90Idx = findPercentileBin(0.9);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = params[0];
          const bin = data.bins[p.dataIndex];
          return `
            <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
            <div>退货单数: <b>${p.value}</b></div>
            ${bin ? `<div>平均周期: <b>${bin.avgDays}天</b></div>` : ""}
          `;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "8%",
        top: "12%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: data.bins.map((b) => b.range),
        axisLabel: { fontSize: 11, color: "#64748b" },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "退货单数",
        nameTextStyle: { fontSize: 11, color: "#64748b" },
        axisLabel: { fontSize: 11, color: "#64748b" },
        splitLine: { lineStyle: { color: "#f1f5f9" } },
      },
      series: [
        {
          type: "bar",
          data: data.bins.map((b) => ({
            value: b.count,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#60a5fa" },
                { offset: 1, color: "#2563eb" },
              ]),
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: "60%",
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { type: "dashed", width: 1.5 },
            label: { position: "end", fontSize: 10, formatter: "{b}" },
            data: [
              { name: "P50", xAxis: p50Idx, lineStyle: { color: "#059669" } },
              { name: "P90", xAxis: p90Idx, lineStyle: { color: "#d97706" } },
            ],
          },
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
