'use client';

import { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { BoxPlotData } from '@/lib/services/analytics';

interface BoxPlotChartProps {
  data: BoxPlotData[];
  title?: string;
  height?: number;
}

export default function BoxPlotChart({ data, title, height = 400 }: BoxPlotChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const boxData = data.map((d) => [
      d.stats.min,
      d.stats.q1,
      d.stats.median,
      d.stats.q3,
      d.stats.max,
    ]);

    const outlierData = data.flatMap((d, categoryIndex) =>
      d.outliers.map((outlier) => [categoryIndex, outlier])
    );

    const option: echarts.EChartsOption = {
      title: title
        ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 600, color: '#1f2937' },
          }
        : undefined,
      tooltip: {
        trigger: 'item',
        formatter: function (params: any) {
          if (params.seriesType === 'scatter') {
            return `异常值: ${params.value[1]}`;
          }
          const idx = params.dataIndex;
          const d = data[idx];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${d.category}</div>
            <div>最小值: ${d.stats.min}</div>
            <div>下四分位数: ${d.stats.q1}</div>
            <div>中位数: ${d.stats.median}</div>
            <div>上四分位数: ${d.stats.q3}</div>
            <div>最大值: ${d.stats.max}</div>
            <div>异常值: ${d.outliers.length}个</div>
          `;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: title ? '15%' : '10%',
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.category),
        axisLabel: { color: '#6b7280', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value',
        name: '分数',
        min: 0,
        max: 100,
        axisLabel: { color: '#6b7280', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [
        {
          name: '箱线图',
          type: 'boxplot',
          data: boxData,
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              color: '#2563eb',
            },
          },
        },
        {
          name: '异常值',
          type: 'scatter',
          data: outlierData,
          itemStyle: {
            color: '#ef4444',
          },
          symbolSize: 8,
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data, title]);

  return <div ref={chartRef} style={{ height }} />;
}
