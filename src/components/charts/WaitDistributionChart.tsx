"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { WaitDistributionItem } from "@/types";

interface WaitDistributionChartProps {
  data: WaitDistributionItem[];
  height?: number;
}

export function WaitDistributionChart({ data, height = 280 }: WaitDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: (params: any) => {
          const item = params[0];
          return `
            <div class="font-medium">${item.name}</div>
            <div>患者数量: ${item.value} 人次</div>
          `;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.bucket),
        axisLabel: {
          fontSize: 10,
          color: "#86909C",
          interval: 0,
          rotate: 30,
        },
        axisLine: {
          lineStyle: {
            color: "#E5E6EB",
          },
        },
      },
      yAxis: {
        type: "value",
        name: "人次",
        nameTextStyle: {
          fontSize: 10,
          color: "#86909C",
        },
        axisLabel: {
          fontSize: 10,
          color: "#86909C",
        },
        splitLine: {
          lineStyle: {
            color: "#F2F3F5",
          },
        },
      },
      series: [
        {
          type: "bar",
          data: data.map((d, index) => ({
            value: d.count,
            itemStyle: {
              color: index >= 4
                ? "#F53F3F"
                : index >= 3
                ? "#FF7D00"
                : "#165DFF",
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: "60%",
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
