"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { TrendItem, Annotation } from "@/types";

interface TrendChartProps {
  data: TrendItem[];
  annotations?: Annotation[];
  height?: number;
  onPointClick?: (date: string) => void;
}

export function TrendChart({ data, annotations = [], height = 280, onPointClick }: TrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    const markPoints = annotations
      .filter((a) => a.metadata?.date)
      .map((a) => ({
        name: a.description,
        xAxis: a.metadata.date,
        yAxis: data.find((d) => d.date === a.metadata.date)?.avgWaitTotal || 0,
        itemStyle: {
          color: "#F53F3F",
        },
        label: {
          show: true,
          formatter: "!",
          fontSize: 12,
          fontWeight: "bold" as const,
        },
      }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const item = params[0];
          return `
            <div class="font-medium mb-1">${item.axisValue}</div>
            <div>平均等待: ${item.value} 分钟</div>
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
        boundaryGap: false,
        data: data.map((d) => d.date),
        axisLabel: {
          fontSize: 10,
          color: "#86909C",
          rotate: 45,
        },
        axisLine: {
          lineStyle: {
            color: "#E5E6EB",
          },
        },
      },
      yAxis: {
        type: "value",
        name: "分钟",
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
          name: "平均等待时间",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: data.map((d) => d.avgWaitTotal),
          lineStyle: {
            color: "#165DFF",
            width: 2,
          },
          itemStyle: {
            color: "#165DFF",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(22, 93, 255, 0.3)" },
              { offset: 1, color: "rgba(22, 93, 255, 0.05)" },
            ]),
          },
          markPoint: {
            data: markPoints,
            symbolSize: 20,
          },
        },
      ],
    };

    chart.setOption(option);

    chart.on("click", (params: any) => {
      if (params.componentType === "series" && onPointClick) {
        onPointClick(data[params.dataIndex].date);
      }
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, annotations, onPointClick]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
