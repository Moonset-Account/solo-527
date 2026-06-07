import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { reportsAPI } from '../api';
import type { NotificationRateStats, EventStatusStats, HandleDurationStats } from '../types';
import { levelConfig } from '../utils';

const ReportsPage = () => {
  const [notificationRate, setNotificationRate] = useState<NotificationRateStats | null>(null);
  const [eventStatus, setEventStatus] = useState<EventStatusStats | null>(null);
  const [handleDuration, setHandleDuration] = useState<HandleDurationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rate, status, duration] = await Promise.all([
        reportsAPI.getNotificationRate(),
        reportsAPI.getEventStatus(),
        reportsAPI.getHandleDuration(),
      ]);
      setNotificationRate(rate);
      setEventStatus(status);
      setHandleDuration(duration);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = (anonymous: boolean) => {
    reportsAPI.export(anonymous);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  const notificationPie = notificationRate ? {
    title: { text: '通知完成率', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c} ({d}%)' },
      data: [
        { value: notificationRate.success, name: '通知成功', itemStyle: { color: '#10b981' } },
        { value: notificationRate.failed, name: '通知失败', itemStyle: { color: '#ef4444' } },
        { value: notificationRate.total - notificationRate.success - notificationRate.failed, name: '待通知', itemStyle: { color: '#9ca3af' } },
      ]
    }]
  } : null;

  const statusBar = eventStatus ? {
    title: { text: '事件状态口径', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: '5%' },
    xAxis: { type: 'category', data: ['低', '中', '高', '紧急'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: '未确认',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#f59e0b' },
        data: Object.values(eventStatus.by_level).map(l => l.unconfirmed)
      },
      {
        name: '处理中',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#3b82f6' },
        data: Object.values(eventStatus.by_level).map(l => l.processing)
      },
      {
        name: '已关闭',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#6b7280' },
        data: Object.values(eventStatus.by_level).map(l => l.closed)
      }
    ]
  } : null;

  const durationBar = handleDuration ? {
    title: { text: '平均处理耗时(分钟)', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['低', '中', '高', '紧急'] },
    yAxis: { type: 'value', name: '分钟' },
    series: [{
      type: 'bar',
      data: Object.entries(handleDuration.by_level).map(([level, data]) => ({
        value: Math.round(data.avg_minutes),
        itemStyle: {
          color: level === 'critical' ? '#ef4444' :
                 level === 'high' ? '#f97316' :
                 level === 'medium' ? '#f59e0b' : '#10b981'
        }
      })),
      label: { show: true, position: 'top' }
    }]
  } : null;

  const durationTrend = handleDuration && handleDuration.by_date.length > 0 ? {
    title: { text: '处理耗时趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: handleDuration.by_date.map(d => d.date)
    },
    yAxis: { type: 'value', name: '分钟' },
    series: [{
      type: 'line',
      smooth: true,
      data: handleDuration.by_date.map(d => Math.round(d.avg_minutes)),
      areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
      lineStyle: { color: '#3b82f6' },
      itemStyle: { color: '#3b82f6' }
    }]
  } : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">数据报表</h1>
          <p className="text-gray-500">通知完成率、事件状态统计、处理耗时分析</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            导出匿名报告
          </button>
          <button
            onClick={() => handleExport(false)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
          >
            导出完整报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">总事件数</div>
          <div className="text-3xl font-bold text-gray-800">{notificationRate?.total || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">通知成功率</div>
          <div className="text-3xl font-bold text-green-600">
            {notificationRate ? (notificationRate.rate * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">平均处理时长</div>
          <div className="text-3xl font-bold text-primary-600">
            {handleDuration ? Math.round(handleDuration.overall_avg_minutes) : 0} 分钟
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">未确认事件</div>
          <div className="text-3xl font-bold text-warning">{eventStatus?.unconfirmed || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {notificationPie && <ReactECharts option={notificationPie} style={{ height: '350px' }} />}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          {statusBar && <ReactECharts option={statusBar} style={{ height: '350px' }} />}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          {durationBar && <ReactECharts option={durationBar} style={{ height: '350px' }} />}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          {durationTrend && <ReactECharts option={durationTrend} style={{ height: '350px' }} />}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
