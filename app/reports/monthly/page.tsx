'use client';

import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Star,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { mockMonthlyReport } from '@/lib/mockData';

export default function MonthlyReportPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-06');

  const report = mockMonthlyReport;

  const delayPieOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 次 ({d}%)',
      },
      legend: {
        bottom: 0,
        left: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color: '#52525b',
        },
      },
      color: ['#0F766E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'],
      series: [
        {
          name: '延期原因',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 500,
            },
          },
          labelLine: {
            show: false,
          },
          data: report.delay_reasons.map((item) => ({
            value: item.count,
            name: item.reason,
          })),
        },
      ],
    };
  }, [report]);

  const qualityBarOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: 40,
        right: 20,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: report.quality_issues.map((item) => item.category),
        axisLabel: {
          fontSize: 12,
          color: '#52525b',
          interval: 0,
        },
        axisLine: {
          lineStyle: {
            color: '#e4e4e7',
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 12,
          color: '#71717a',
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#f4f4f5',
          },
        },
      },
      series: [
        {
          name: '问题数量',
          type: 'bar',
          barWidth: '40%',
          itemStyle: {
            color: '#F59E0B',
            borderRadius: [4, 4, 0, 0],
          },
          data: report.quality_issues.map((item) => item.count),
        },
      ],
    };
  }, [report]);

  const managerBarOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        right: 0,
        top: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
          color: '#52525b',
        },
      },
      grid: {
        left: 40,
        right: 20,
        top: 40,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: report.managers.map((m) => m.name),
        axisLabel: {
          fontSize: 12,
          color: '#52525b',
        },
        axisLine: {
          lineStyle: {
            color: '#e4e4e7',
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '按时率(%) / 质量分',
          min: 0,
          max: 100,
          axisLabel: {
            fontSize: 12,
            color: '#71717a',
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            lineStyle: {
              color: '#f4f4f5',
            },
          },
        },
        {
          type: 'value',
          name: '项目数',
          min: 0,
          axisLabel: {
            fontSize: 12,
            color: '#71717a',
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: '按时完成率',
          type: 'bar',
          barWidth: '20%',
          itemStyle: {
            color: '#0F766E',
            borderRadius: [4, 4, 0, 0],
          },
          data: report.managers.map((m) => m.on_time_rate),
        },
        {
          name: '平均质量分',
          type: 'bar',
          barWidth: '20%',
          itemStyle: {
            color: '#3B82F6',
            borderRadius: [4, 4, 0, 0],
          },
          data: report.managers.map((m) => m.avg_quality_score),
        },
        {
          name: '项目数',
          type: 'line',
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#F59E0B',
          },
          lineStyle: {
            width: 2,
            color: '#F59E0B',
          },
          data: report.managers.map((m) => m.project_count),
        },
      ],
    };
  }, [report]);

  const metricCards = [
    {
      icon: CheckCircle2,
      label: '本月完工项目',
      value: `${report.completed_projects} / ${report.total_projects}`,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      icon: AlertTriangle,
      label: '延期节点数',
      value: `${report.delayed_nodes}`,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
      border: 'border-danger-100',
    },
    {
      icon: Clock,
      label: '平均延期天数',
      value: `${report.avg_delay_days} 天`,
      color: 'text-warn-600',
      bg: 'bg-warn-50',
      border: 'border-warn-100',
    },
    {
      icon: Star,
      label: '质量平均分',
      value: `${report.avg_quality_score}`,
      color: 'text-brand-700',
      bg: 'bg-brand-50',
      border: 'border-brand-100',
    },
    {
      icon: TrendingUp,
      label: '预算超支率',
      value: `${report.budget_overrun_rate}%`,
      color: report.budget_overrun_rate > 5 ? 'text-danger-600' : 'text-brand-700',
      bg: report.budget_overrun_rate > 5 ? 'bg-danger-50' : 'bg-brand-50',
      border: report.budget_overrun_rate > 5 ? 'border-danger-100' : 'border-brand-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">月度复盘报表</h1>
          <p className="mt-1 text-sm text-zinc-500">
            项目整体进度、质量、预算情况复盘分析
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2">
          <Calendar className="h-4 w-4 text-zinc-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none bg-transparent text-sm text-zinc-700 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {metricCards.map((card, idx) => (
          <Card key={idx} className={card.border}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-zinc-500">{card.label}</div>
                <div className={`mt-2 text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
              </div>
              <div className={`rounded-lg ${card.bg} p-2`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="延期原因分布">
          <ReactECharts
            option={delayPieOption}
            style={{ height: 320 }}
            opts={{ renderer: 'svg' }}
          />
        </Card>

        <Card title="质量问题统计">
          <ReactECharts
            option={qualityBarOption}
            style={{ height: 320 }}
            opts={{ renderer: 'svg' }}
          />
        </Card>
      </div>

      <Card title="项目经理绩效对比">
        <ReactECharts
          option={managerBarOption}
          style={{ height: 360 }}
          opts={{ renderer: 'svg' }}
        />
      </Card>
    </div>
  );
}
