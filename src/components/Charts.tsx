import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { chartColors } from '@/utils';
import type { ClosureRateTrendItem, OverdueRankingItem, FloorHeatmapItem, TeamTrendItem } from '@/types';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, className, action }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

interface ClosureRateTrendChartProps {
  data: ClosureRateTrendItem[];
}

export const ClosureRateTrendChart: React.FC<ClosureRateTrendChartProps> = ({ data }) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/>闭环率: ${item.value}%<br/>关闭数: ${data[item.dataIndex]?.closed || 0}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: {
        color: '#86909C',
        fontSize: 11,
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: '闭环率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map((d) => d.rate),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 93, 255, 0.05)' },
            ],
          },
        },
        lineStyle: {
          color: chartColors.primary,
          width: 2,
        },
        itemStyle: {
          color: chartColors.primary,
          borderWidth: 2,
          borderColor: '#fff',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '280px' }} />;
};

interface OverdueRankingChartProps {
  data: OverdueRankingItem[];
  onBarClick?: (teamId: string) => void;
}

export const OverdueRankingChart: React.FC<OverdueRankingChartProps> = ({ data, onBarClick }) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        const dataItem = data[item.dataIndex];
        return `${item.name}<br/>逾期数: ${dataItem.count}项<br/>罚款金额: ¥${dataItem.amount.toLocaleString()}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: { color: '#86909C', fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.teamName),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisTick: { show: false },
      axisLabel: { color: '#4E5969', fontSize: 12 },
      inverse: true,
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => ({
          value: d.count,
          itemStyle: {
            color: d.count > 0 ? chartColors.danger : chartColors.info,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: 16,
        label: {
          show: true,
          position: 'right',
          color: '#4E5969',
          fontSize: 12,
          formatter: '{c}项',
        },
      },
    ],
  };

  const onEvents = onBarClick ? {
    click: (params: any) => {
      onBarClick(data[params.dataIndex]?.teamId);
    },
  } : undefined;

  return <ReactECharts option={option} style={{ height: '280px' }} onEvents={onEvents} />;
};

interface FloorHeatmapChartProps {
  data: FloorHeatmapItem[];
}

export const FloorHeatmapChart: React.FC<FloorHeatmapChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => a.floor - b.floor);
  const maxCount = Math.max(...sortedData.map((d) => d.count), 1);
  const getFloorLabel = (floor: number) => floor < 0 ? `B${Math.abs(floor)}` : `${floor}F`;

  const option: EChartsOption = {
    tooltip: {
      formatter: (params: any) => {
        const item = sortedData[params.dataIndex];
        const points = item.points.map((p) => `${p.name}: ${p.count}项`).join('<br/>');
        return `${getFloorLabel(item.floor)}<br/>总隐患数: ${item.count}项<br/><br/>${points}`;
      },
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '5%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['隐患密度'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: 'category',
      data: sortedData.map((d) => getFloorLabel(d.floor)),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisTick: { show: false },
      axisLabel: { color: '#4E5969', fontSize: 12 },
    },
    visualMap: {
      min: 0,
      max: maxCount,
      show: false,
      inRange: {
        color: ['#E8F3FF', '#BEDAFF', '#94BFFF', '#6AA1FF', '#4080FF', '#165DFF'],
      },
    },
    series: [
      {
        type: 'bar',
        data: sortedData.map((d, index) => ({
          value: [0, index, d.count],
          itemStyle: {
            borderRadius: 4,
          },
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          color: '#4E5969',
          fontSize: 13,
          fontWeight: 600,
          formatter: (params: any) => `${sortedData[params.dataIndex].count} 项`,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '280px' }} />;
};

interface TeamTrendChartProps {
  data: TeamTrendItem[];
}

export const TeamTrendChart: React.FC<TeamTrendChartProps> = ({ data }) => {
  const teams = Array.from(new Set(data.map((d) => d.team)));
  const dates = Array.from(new Set(data.map((d) => d.date))).sort();
  const colors = [chartColors.primary, chartColors.success, chartColors.warning, chartColors.purple];

  const series = teams.map((team, idx) => ({
    name: team,
    type: 'line' as const,
    smooth: true,
    symbol: 'circle',
    symbolSize: 5,
    data: dates.map((date) => {
      const item = data.find((d) => d.team === team && d.date === date);
      return item ? item.completed : 0;
    }),
    lineStyle: {
      color: colors[idx % colors.length],
      width: 2,
    },
    itemStyle: {
      color: colors[idx % colors.length],
    },
  }));

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: teams,
      bottom: 0,
      textStyle: { color: '#4E5969', fontSize: 11 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: { color: '#86909C', fontSize: 11 },
    },
    series,
  };

  return <ReactECharts option={option} style={{ height: '280px' }} />;
};
