"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { SankeyData } from "@/types";
import { getWaitColor } from "@/utils";

interface SankeyChartProps {
  data: SankeyData;
  height?: number;
  onNodeClick?: (nodeName: string) => void;
}

export function SankeyChart({ data, height = 350, onNodeClick }: SankeyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    const linksWithStyle = data.links.map((link) => ({
      ...link,
      lineStyle: {
        color: getWaitColor(link.waitTime),
        opacity: 0.5,
        curveness: 0.5,
      },
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
        formatter: (params: any) => {
          if (params.dataType === "edge") {
            return `
              <div class="font-medium">${params.data.source} → ${params.data.target}</div>
              <div>流量: ${params.data.value} 人次</div>
              <div>平均等待: ${params.data.waitTime} 分钟</div>
            `;
          }
          return `<div class="font-medium">${params.name}</div>`;
        },
      },
      series: [
        {
          type: "sankey",
          emphasis: {
            focus: "adjacency",
          },
          nodeWidth: 20,
          nodeGap: 12,
          data: data.nodes,
          links: linksWithStyle,
          label: {
            show: true,
            position: "right",
            fontSize: 12,
            color: "#4E5969",
          },
          lineStyle: {
            curveness: 0.5,
          },
        } as any,
      ],
    };

    chart.setOption(option);

    chart.on("click", (params: any) => {
      if (params.dataType === "node" && onNodeClick) {
        onNodeClick(params.name);
      }
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, onNodeClick]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
