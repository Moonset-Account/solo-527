"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { DepartmentComparisonItem } from "@/types";

interface DepartmentComparisonChartProps {
  data: DepartmentComparisonItem[];
  height?: number;
  onDeptClick?: (deptId: string) => void;
}

export function DepartmentComparisonChart({
  data,
  height = 280,
  onDeptClick,
}: DepartmentComparisonChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;
    const sortedData = [...data].sort((a, b) => b.avgWaitTotal - a.avgWaitTotal).slice(0, 8);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: (params: any) => {
          const deptName = params[0].name;
          const waitItem = params.find((p: any) => p.seriesName === "平均等待");
          const visitItem = params.find((p: any) => p.seriesName === "就诊人次");
          return `
            <div class="font-medium mb-1">${deptName}</div>
            <div>平均等待: ${waitItem?.value || 0} 分钟</div>
            <div>就诊人次: ${visitItem?.value || 0}</div>
          `;
        },
      },
      legend: {
        data: ["平均等待", "就诊人次"],
        right: 0,
        top: 0,
        textStyle: {
          fontSize: 11,
          color: "#86909C",
        },
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
        data: sortedData.map((d) => d.deptName),
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
      yAxis: [
        {
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
        {
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
            show: false,
          },
        },
      ],
      series: [
        {
          name: "平均等待",
          type: "bar",
          data: sortedData.map((d) => ({
            value: d.avgWaitTotal,
            deptId: d.deptId,
          })),
          itemStyle: {
            color: "#165DFF",
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: "30%",
        },
        {
          name: "就诊人次",
          type: "line",
          yAxisIndex: 1,
          data: sortedData.map((d) => d.totalVisits),
          itemStyle: {
            color: "#FF7D00",
          },
          lineStyle: {
            width: 2,
          },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
    };

    chart.setOption(option);

    chart.on("click", (params: any) => {
      if (params.data?.deptId && onDeptClick) {
        onDeptClick(params.data.deptId);
      }
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, onDeptClick]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
