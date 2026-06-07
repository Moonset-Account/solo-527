"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ProductRank } from "@/lib/types";

interface Props {
  data: ProductRank[] | null;
  loading?: boolean;
  height?: number;
}

export default function ProductRanking({ data, loading, height = 380 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    if (!data || data.length === 0) {
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

    const top10 = data.slice(0, 10).reverse();

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = params[0];
          const item = top10[p.dataIndex];
          return `
            <div style="font-weight:600;margin-bottom:4px">${item.name}</div>
            <div>退货数量: <b>${item.returns}</b></div>
            <div>退货率: <b>${item.returnRate}%</b></div>
            <div>主要原因: <b>${item.topReason}</b></div>
          `;
        },
      },
      grid: {
        left: "3%",
        right: "8%",
        bottom: "3%",
        top: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: { fontSize: 11, color: "#64748b" },
        splitLine: { lineStyle: { color: "#f1f5f9" } },
      },
      yAxis: {
        type: "category",
        data: top10.map((p) => p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name),
        axisLabel: {
          fontSize: 11,
          color: "#334155",
          fontWeight: 500,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: top10.map((p, i) => ({
            value: p.returns,
            itemStyle: {
              color: i >= 7
                ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: "#dc2626" },
                    { offset: 1, color: "#f87171" },
                  ])
                : new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: "#2563eb" },
                    { offset: 1, color: "#60a5fa" },
                  ]),
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: "60%",
          label: {
            show: true,
            position: "right",
            fontSize: 11,
            color: "#64748b",
            formatter: (p: any) => `${top10[p.dataIndex].returnRate}%`,
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
