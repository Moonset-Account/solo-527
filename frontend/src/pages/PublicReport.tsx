import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { reportsAPI } from '../api';
import type { PublicReportStats } from '../types';
import { useAuth } from '../auth';
import { Link } from 'react-router-dom';

const PublicReport = () => {
  const [stats, setStats] = useState<PublicReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    reportsAPI.getPublic()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    reportsAPI.export(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const levelPie = stats ? {
    title: { text: '事件等级分布', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}: {c} ({d}%)' },
      data: [
        { value: stats.event_level_distribution.low, name: '低', itemStyle: { color: '#10b981' } },
        { value: stats.event_level_distribution.medium, name: '中', itemStyle: { color: '#f59e0b' } },
        { value: stats.event_level_distribution.high, name: '高', itemStyle: { color: '#f97316' } },
        { value: stats.event_level_distribution.critical, name: '紧急', itemStyle: { color: '#ef4444' } },
      ]
    }]
  } : null;

  const monthlyBar = stats && stats.events_by_month.length > 0 ? {
    title: { text: '事件月度趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: stats.events_by_month.map(m => m.month) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: stats.events_by_month.map(m => m.count),
      itemStyle: { color: '#1e3a5f' },
      label: { show: true, position: 'top' }
    }]
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-700 text-white py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🏕️ 研学营地安全公开报表</h1>
              <p className="text-primary-200 mt-1">匿名化聚合统计数据</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                导出匿名报告
              </button>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  登录系统
                </Link>
              )}
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  进入看板
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-500 text-sm mb-1">累计事件</div>
            <div className="text-3xl font-bold text-gray-800">{stats?.total_events || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-500 text-sm mb-1">平均处理时长</div>
            <div className="text-3xl font-bold text-primary-600">
              {stats ? Math.round(stats.avg_handle_duration_minutes) : 0} 分钟
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-500 text-sm mb-1">家长通知成功率</div>
            <div className="text-3xl font-bold text-green-600">
              {stats ? (stats.notification_success_rate * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-500 text-sm mb-1">近6月事件</div>
            <div className="text-3xl font-bold text-warning">
              {stats?.events_by_month.reduce((sum, m) => sum + m.count, 0) || 0}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {levelPie && <ReactECharts option={levelPie} style={{ height: '350px' }} />}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            {monthlyBar && <ReactECharts option={monthlyBar} style={{ height: '350px' }} />}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">数据说明</h2>
          <div className="text-sm text-gray-500 space-y-2">
            <p>• 本页面展示的所有数据均为匿名化聚合统计，不包含任何个人信息、具体时间、地点等敏感内容</p>
            <p>• 处理时长基于事件真实发生时间计算，而非补录时间</p>
            <p>• 如需查看详细事件信息，请登录系统</p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          研学营地安全事件复盘系统 · 数据更新时间: {new Date().toLocaleString('zh-CN')}
        </div>
      </footer>
    </div>
  );
};

export default PublicReport;
