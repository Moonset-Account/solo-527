"use client";

import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { TagDistribution } from "@/types";
import { PieChart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagDistributionChartProps {
  data: TagDistribution[];
}

export function TagDistributionChart({ data }: TagDistributionChartProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  const pieOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        right: "5%",
        top: "center",
        textStyle: { fontSize: 11 },
      },
      series: [
        {
          name: "问题标签",
          type: "pie",
          radius: ["40%", "70%"],
          center: ["35%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
            },
          },
          data: data.slice(0, 10).map((d) => ({
            value: d.count,
            name: d.tagName,
          })),
          color: [
            "#165DFF", "#00B42A", "#FF7D00", "#F53F3F", "#722ED1",
            "#14C9C9", "#F7BA1E", "#F5319D", "#86909C", "#272E3B",
          ],
        },
      ],
    };
  }, [data]);

  const barOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}<br/>数量: ${item.value}<br/>占比: ${data[item.dataIndex]?.percentage.toFixed(1)}%`;
        },
      },
      grid: {
        left: "3%",
        right: "10%",
        bottom: "3%",
        top: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: { formatter: "{value}" },
        splitLine: { lineStyle: { type: "dashed" } },
      },
      yAxis: {
        type: "category",
        data: data.slice(0, 10).map((d) => d.tagName).reverse(),
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          name: "会话数",
          type: "bar",
          data: data.slice(0, 10).map((d) => d.count).reverse(),
          itemStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: "#165DFF" },
                { offset: 1, color: "#5DA0FF" },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: "right",
            formatter: "{c}",
            fontSize: 11,
          },
        },
      ],
    };
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-neutral-700">标签分布</h4>
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          <button
            onClick={() => setChartType("pie")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              chartType === "pie"
                ? "bg-white shadow-sm text-primary-600"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <PieChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              chartType === "bar"
                ? "bg-white shadow-sm text-primary-600"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ReactECharts
        option={chartType === "pie" ? pieOption : barOption}
        style={{ height: "380px", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
