import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface ChartCardProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div className={`bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-display font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

interface BaseChartProps {
  option: EChartsOption;
  height?: number;
  onReady?: (chart: echarts.ECharts) => void;
}

export function BaseChart({ option, height = 300, onReady }: BaseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
      if (onReady) onReady(chartInstance.current);
    }

    const chart = chartInstance.current;
    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [option, onReady]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}
