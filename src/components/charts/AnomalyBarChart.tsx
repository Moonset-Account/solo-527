import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js';
import type { AnomalyStatistics } from '@shared/types';

interface AnomalyBarChartProps {
  data: AnomalyStatistics[];
  loading?: boolean;
}

export default function AnomalyBarChart({ data, loading }: AnomalyBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || loading) return;

    const traces: any[] = [
      {
        x: data.map(d => d.dimensionValue),
        y: data.map(d => Math.round(d.totalAnomalyDuration / 60)),
        type: 'bar',
        name: '异常时长(分钟)',
        marker: {
          color: data.map(d => d.totalAnomalyDuration > 1800 ? '#FF4D4F' : d.totalAnomalyDuration > 600 ? '#FAAD14' : '#52C41A'),
        },
        hovertemplate: '%{x}<br>异常时长: %{y} 分钟<br>异常次数: %{text}<extra></extra>',
        text: data.map(d => d.anomalyCount + ' 次'),
      },
    ];

    const layout: any = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 20, r: 20, b: 60, l: 50 },
      xaxis: {
        tickfont: { color: '#64748b', size: 11 },
        tickangle: -30,
      },
      yaxis: {
        title: { text: '异常时长 (分钟)', font: { color: '#64748b', size: 12 } },
        gridcolor: '#f1f5f9',
        tickfont: { color: '#64748b', size: 11 },
      },
      hovermode: 'x',
    };

    const config: any = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot(chartRef.current, traces, layout, config);

    return () => {
      if (chartRef.current) {
        Plotly.purge(chartRef.current);
      }
    };
  }, [data, loading]);

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return <div ref={chartRef} className="h-80 w-full" />;
}
