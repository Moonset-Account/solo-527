import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { RadarData, StrengthData, Athlete } from '@shared/types';
import { EmptyState, LoadingState } from './EmptyStates';
import { useMemo } from 'react';

interface RadarChartProps {
  data: RadarData | null;
  athleteName?: string;
  isLoading?: boolean;
}

export function RadarChart({ data, athleteName, isLoading }: RadarChartProps) {
  if (isLoading) return <LoadingState />;
  if (!data || !data.metrics || data.metrics.length === 0) return <EmptyState icon="chart" title="暂无雷达数据" />;

  const option: EChartsOption = {
    tooltip: {
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#E2E8F0', fontSize: 12 },
    },
    radar: {
      indicator: data.metrics.map((m) => ({ name: m.name, max: m.max })),
      splitArea: {
        areaStyle: {
          color: ['rgba(51, 65, 85, 0.2)', 'rgba(51, 65, 85, 0.4)'],
        },
      },
      axisLine: { lineStyle: { color: '#475569' } },
      splitLine: { lineStyle: { color: '#475569' } },
      axisName: {
        color: '#94A3B8',
        fontSize: 12,
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: data.metrics.map((m) => m.value),
            name: athleteName || '能力评估',
            areaStyle: {
              color: 'rgba(56, 189, 248, 0.25)',
            },
            lineStyle: {
              color: '#38BDF8',
              width: 2,
            },
            itemStyle: {
              color: '#38BDF8',
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="w-full h-72">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

interface CompareChartProps {
  strengthData: StrengthData[];
  athletes: Athlete[];
  isLoading?: boolean;
}

export function CompareBarChart({ strengthData, athletes, isLoading }: CompareChartProps) {
  if (isLoading) return <LoadingState />;
  if (strengthData.length === 0) return <EmptyState icon="chart" title="暂无对比数据" />;

  const athleteData = useMemo(() => {
    const byAthlete: Record<string, number> = {};
    strengthData.forEach((d) => {
      if (!byAthlete[d.athleteId]) {
        byAthlete[d.athleteId] = 0;
      }
      byAthlete[d.athleteId] += d.weightKg * d.reps * d.sets;
    });
    return Object.entries(byAthlete)
      .map(([id, total]) => ({
        name: athletes.find((a) => a.id === id)?.name || id,
        value: Math.round(total),
      }))
      .sort((a, b) => b.value - a.value);
  }, [strengthData, athletes]);

  const option: EChartsOption = {
    tooltip: {
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#E2E8F0', fontSize: 12 },
      formatter: '{b}: {c} kg',
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
      data: athleteData.map((d) => d.name),
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#334155' } },
    },
    series: [
      {
        type: 'bar',
        data: athleteData.map((d, i) => ({
          value: d.value,
          itemStyle: {
            color: i === 0
              ? {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#38BDF8' },
                    { offset: 1, color: '#0EA5E9' },
                  ],
                }
              : {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#475569' },
                    { offset: 1, color: '#334155' },
                  ],
                },
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: '50%',
        animationDuration: 1000,
        animationEasing: 'elasticOut',
      },
    ],
  };

  return (
    <div className="w-full h-64">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

interface ExerciseCompareProps {
  strengthData: StrengthData[];
  isLoading?: boolean;
}

export function ExerciseCompareChart({ strengthData, isLoading }: ExerciseCompareProps) {
  if (isLoading) return <LoadingState />;
  if (strengthData.length === 0) return <EmptyState icon="chart" title="暂无动作数据" />;

  const exerciseData = useMemo(() => {
    const byExercise: Record<string, { weight: number; count: number }> = {};
    strengthData.forEach((d) => {
      if (!byExercise[d.exercise]) {
        byExercise[d.exercise] = { weight: 0, count: 0 };
      }
      byExercise[d.exercise].weight += (d.estimated1Rm || d.weightKg);
      byExercise[d.exercise].count += 1;
    });
    return Object.entries(byExercise)
      .map(([name, data]) => ({
        name,
        value: Math.round(data.weight / data.count),
      }))
      .sort((a, b) => b.value - a.value);
  }, [strengthData]);

  const option: EChartsOption = {
    tooltip: {
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#E2E8F0', fontSize: 12 },
      formatter: '{b}: {c} kg (1RM)',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'category',
      data: exerciseData.map((d) => d.name),
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8', fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: exerciseData.map((d) => ({
          value: d.value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#F97316' },
                { offset: 1, color: '#EA580C' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: '60%',
        animationDuration: 1000,
      },
    ],
  };

  return (
    <div className="w-full h-64">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
