"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { ReasonNode } from "@/lib/types";

interface Props {
  data: ReasonNode | null;
  loading?: boolean;
  height?: number;
}

const COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];

export default function ReasonTreeMap({ data, loading, height = 380 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { toggleFilterValue } = useDashboardStore();

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    if (!data || !data.children) {
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

    const flatData = data.children.flatMap((cat, catIdx) =>
      (cat.children || []).map((child) => ({
        name: `${cat.name} - ${child.name}`,
        value: child.value,
        path: child.path,
        category: cat.name,
        itemStyle: {
          color: COLORS[catIdx % COLORS.length],
          borderColor: "#fff",
          borderWidth: 2,
        },
      }))
    );

    const option: echarts.EChartsOption = {
      tooltip: {
        formatter: (params: any) => {
          const d = params.data;
          return `
            <div style="font-weight:600;margin-bottom:4px">${d.name}</div>
            <div>退货数量: <b>${d.value}</b></div>
            <div style="color:#64748b;font-size:12px;margin-top:4px">点击查看明细</div>
          `;
        },
      },
      series: [
        {
          type: "treemap",
          width: "96%",
          height: "92%",
          top: "4%",
          left: "2%",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            formatter: "{b}",
            fontSize: 12,
            color: "#fff",
            fontWeight: 500,
            overflow: "truncate",
          },
          emphasis: {
            label: { fontSize: 13 },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0,0,0,0.3)",
            },
          },
          data: flatData,
        },
      ],
    };

    chart.setOption(option, true);

    chart.on("click", (params: any) => {
      if (params.data && params.data.path) {
        const [cat, detail] = params.data.path.split("/");
        if (detail) {
          toggleFilterValue("reasons", `${cat}:${detail}`);
        } else {
          toggleFilterValue("reasons", cat);
        }
      }
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, loading, toggleFilterValue]);

  return (
    <div ref={chartRef} style={{ width: "100%", height }} />
  );
}
