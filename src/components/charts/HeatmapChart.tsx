"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { HeatmapItem, WEEK_DAYS } from "@/types";

interface HeatmapChartProps {
  data: HeatmapItem[];
  height?: number;
}

export function HeatmapChart({ data, height = 280 }: HeatmapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const days = WEEK_DAYS;

    const option: echarts.EChartsOption = {
      tooltip: {
        position: "top",
        formatter: (params: any) => {
          return `
            <div class="font-medium">${days[params.value[1]]} ${hours[params.value[0]]}</div>
            <div>平均等待: ${params.value[2]} 分钟</div>
          `;
        },
      },
      grid: {
        left: "10%",
        right: "10%",
        top: "5%",
        bottom: "15%",
      },
      xAxis: {
        type: "category",
        data: hours,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontSize: 9,
          color: "#86909C",
          interval: 2,
        },
      },
      yAxis: {
        type: "category",
        data: days,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontSize: 10,
          color: "#86909C",
        },
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "0%",
        textStyle: {
          fontSize: 10,
          color: "#86909C",
        },
        inRange: {
          color: ["#E8F3FF", "#94BFFF", "#165DFF", "#0E42D2"],
        },
      },
      series: [
        {
          name: "平均等待时间",
          type: "heatmap",
          data: data.map((d) => [d.hour, d.dayOfWeek, d.value]),
          label: {
            show: false,
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

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
