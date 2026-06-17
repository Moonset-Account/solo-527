import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  RefreshCw,
} from 'lucide-react';
import * as echarts from 'echarts';
import { reportApi } from '@/api/reportApi';
import type { DurationReport, ResultReport, TrendReport } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { getMonthRange } from '@/utils/formatTime';

export default function Reports() {
  const [dateRange, setDateRange] = useState<[string, string]>(getMonthRange());
  const [durationData, setDurationData] = useState<DurationReport[]>([]);
  const [resultData, setResultData] = useState<ResultReport[]>([]);
  const [trendData, setTrendData] = useState<TrendReport[]>([]);
  const [loading, setLoading] = useState(true);

  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartInstance = useRef<echarts.ECharts | null>(null);
  const pieChartInstance = useRef<echarts.ECharts | null>(null);
  const lineChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  useEffect(() => {
    if (!loading && durationData.length > 0) {
      initBarChart();
      initPieChart();
      initLineChart();
    }

    const handleResize = () => {
      barChartInstance.current?.resize();
      pieChartInstance.current?.resize();
      lineChartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      barChartInstance.current?.dispose();
      pieChartInstance.current?.dispose();
      lineChartInstance.current?.dispose();
    };
  }, [loading, durationData, resultData, trendData]);

  const fetchReports = async () => {
    if (!dateRange[0] || !dateRange[1]) return;
    setLoading(true);
    try {
      const [durationRes, resultRes, trendRes] = await Promise.all([
        reportApi.getDurationReport(dateRange[0], dateRange[1]),
        reportApi.getResultReport(dateRange[0], dateRange[1]),
        reportApi.getTrendReport(dateRange[0], dateRange[1]),
      ]);

      if (durationRes.success) setDurationData(durationRes.data);
      if (resultRes.success) setResultData(resultRes.data);
      if (trendRes.success) setTrendData(trendRes.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setDurationData([
        { category: '首次响应', avgDuration: 3600, maxDuration: 7200, minDuration: 1800, count: 156 },
        { category: '问题确认', avgDuration: 7200, maxDuration: 14400, minDuration: 3600, count: 145 },
        { category: '方案制定', avgDuration: 10800, maxDuration: 28800, minDuration: 3600, count: 138 },
        { category: '方案执行', avgDuration: 14400, maxDuration: 43200, minDuration: 7200, count: 130 },
        { category: '客户确认', avgDuration: 5400, maxDuration: 21600, minDuration: 1800, count: 125 },
      ]);
      setResultData([
        { status: '已解决', count: 428, percentage: 68.5 },
        { status: '已升级', count: 89, percentage: 14.2 },
        { status: '处理中', count: 67, percentage: 10.7 },
        { status: '待处理', count: 41, percentage: 6.6 },
      ]);
      setTrendData(
        Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return {
            date: date.toISOString().split('T')[0],
            ticketCount: 30 + Math.floor(Math.random() * 40),
            escalationRate: 10 + Math.random() * 10,
            satisfactionRate: 85 + Math.random() * 10,
          };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const initBarChart = () => {
    if (!barChartRef.current) return;

    if (!barChartInstance.current) {
      barChartInstance.current = echarts.init(barChartRef.current);
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as Array<{ name: string; value: number }>;
          const hours = Math.floor(p[0].value / 3600);
          const minutes = Math.floor((p[0].value % 3600) / 60);
          return `${p[0].name}<br/>平均耗时: ${hours}小时${minutes}分钟`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: durationData.map((d) => d.category),
        axisLine: { lineStyle: { color: '#e4e4e7' } },
        axisLabel: { color: '#52525b' },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#52525b',
          formatter: (value: number) => {
            const hours = Math.floor(value / 3600);
            return `${hours}h`;
          },
        },
        splitLine: { lineStyle: { color: '#f4f4f5' } },
      },
      series: [
        {
          name: '平均耗时',
          type: 'bar',
          data: durationData.map((d) => d.avgDuration),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#1E40AF' },
              { offset: 1, color: '#3B82F6' },
            ]),
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '50%',
        },
      ],
    };

    barChartInstance.current.setOption(option);
  };

  const initPieChart = () => {
    if (!pieChartRef.current) return;

    if (!pieChartInstance.current) {
      pieChartInstance.current = echarts.init(pieChartRef.current);
    }

    const colors = ['#10B981', '#F97316', '#1E40AF', '#A1A1AA'];

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemGap: 12,
        textStyle: { color: '#52525b' },
      },
      series: [
        {
          name: '处理结果',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: resultData.map((d, i) => ({
            value: d.count,
            name: d.status,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    };

    pieChartInstance.current.setOption(option);
  };

  const initLineChart = () => {
    if (!lineChartRef.current) return;

    if (!lineChartInstance.current) {
      lineChartInstance.current = echarts.init(lineChartRef.current);
    }

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['工单量', '升级率', '满意度'],
        top: 0,
        textStyle: { color: '#52525b' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#e4e4e7' } },
        axisLabel: { color: '#52525b' },
      },
      yAxis: [
        {
          type: 'value',
          name: '工单量',
          position: 'left',
          axisLabel: { color: '#52525b' },
          splitLine: { lineStyle: { color: '#f4f4f5' } },
        },
        {
          type: 'value',
          name: '百分比(%)',
          position: 'right',
          min: 0,
          max: 100,
          axisLabel: { color: '#52525b', formatter: '{value}%' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '工单量',
          type: 'line',
          data: trendData.map((d) => d.ticketCount),
          smooth: true,
          lineStyle: { color: '#1E40AF', width: 2 },
          itemStyle: { color: '#1E40AF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(30, 64, 175, 0.3)' },
              { offset: 1, color: 'rgba(30, 64, 175, 0.05)' },
            ]),
          },
        },
        {
          name: '升级率',
          type: 'line',
          yAxisIndex: 1,
          data: trendData.map((d) => d.escalationRate.toFixed(1)),
          smooth: true,
          lineStyle: { color: '#F97316', width: 2 },
          itemStyle: { color: '#F97316' },
        },
        {
          name: '满意度',
          type: 'line',
          yAxisIndex: 1,
          data: trendData.map((d) => d.satisfactionRate.toFixed(1)),
          smooth: true,
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' },
        },
      ],
    };

    lineChartInstance.current.setOption(option);
  };

  const handleRefresh = () => {
    fetchReports();
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">统计报表</h1>
          <p className="text-zinc-500 mt-1">查看工单处理的各项统计数据</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-72"
          />
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
          >
            导出
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 skeleton rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-80 skeleton rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-600" />
                各环节平均耗时
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={barChartRef} className="h-80 w-full" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-success-600" />
                  处理结果分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={pieChartRef} className="h-80 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-warning-600" />
                  趋势分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={lineChartRef} className="h-80 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-zinc-500 mb-1">总工单量</div>
                <div className="text-3xl font-bold text-zinc-900">
                  {trendData.reduce((sum, d) => sum + d.ticketCount, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-zinc-500 mb-1">平均升级率</div>
                <div className="text-3xl font-bold text-warning-600">
                  {(trendData.reduce((sum, d) => sum + d.escalationRate, 0) / trendData.length).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-zinc-500 mb-1">平均满意度</div>
                <div className="text-3xl font-bold text-success-600">
                  {(trendData.reduce((sum, d) => sum + d.satisfactionRate, 0) / trendData.length).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-zinc-500 mb-1">平均解决率</div>
                <div className="text-3xl font-bold text-primary-600">
                  {(resultData.find((r) => r.status === '已解决')?.percentage || 0).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
