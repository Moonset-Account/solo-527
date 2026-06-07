import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js';
import type { TemperatureRecord } from '@shared/types';
import dayjs from 'dayjs';

interface TemperatureChartProps {
  data: TemperatureRecord[];
  loading?: boolean;
}

export default function TemperatureChart({ data, loading }: TemperatureChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || loading) return;

    const timestamps = data.map(d => dayjs(d.timestamp).format('MM-DD HH:mm'));
    const temperatures = data.map(d => d.temperature);
    const isNormal = data.map(d => d.isNormal);

    const normalTemps = temperatures.map((t, i) => isNormal[i] ? t : null);
    const anomalyTemps = temperatures.map((t, i) => !isNormal[i] ? t : null);

    const traces: any[] = [
      {
        x: timestamps,
        y: normalTemps,
        mode: 'lines',
        name: '正常温度',
        line: { color: '#165DFF', width: 2 },
        hovertemplate: '时间: %{x}<br>温度: %{y:.1f}°C<extra></extra>',
      },
      {
        x: timestamps,
        y: anomalyTemps,
        mode: 'markers',
        name: '异常温度',
        marker: { color: '#FF4D4F', size: 8 },
        hovertemplate: '时间: %{x}<br>温度: %{y:.1f}°C<extra></extra>',
      },
    ];

    const layout: any = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 20, r: 20, b: 40, l: 50 },
      xaxis: {
        gridcolor: '#f1f5f9',
        tickfont: { color: '#64748b', size: 11 },
        nticks: 8,
      },
      yaxis: {
        title: { text: '温度 (°C)', font: { color: '#64748b', size: 12 } },
        gridcolor: '#f1f5f9',
        tickfont: { color: '#64748b', size: 11 },
      },
      legend: {
        orientation: 'h',
        y: 1.1,
        x: 0,
        font: { size: 11 },
      },
      hovermode: 'x unified',
      shapes: [
        {
          type: 'rect',
          xref: 'paper',
          yref: 'y',
          x0: 0,
          y0: 0,
          x1: 1,
          y1: 8,
          fillcolor: 'rgba(82, 196, 26, 0.05)',
          line: { width: 0 },
          layer: 'below',
        },
      ],
    };

    const config: any = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
      displaylogo: false,
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
