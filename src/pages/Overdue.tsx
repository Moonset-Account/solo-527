import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { ChartCard } from '../components/charts/ChartCard';
import { OverdueHeatmapChart } from '../components/charts/OverdueHeatmapChart';
import { AlertTriangle, Clock, MapPin, TrendingDown } from 'lucide-react';

export default function Overdue() {
  const { overdueHeatmap, kpiData, loading, errors, filters, loadOverdueHeatmap } =
    useDashboardStore();

  useEffect(() => {
    loadOverdueHeatmap();
  }, [filters]);

  const overdueStats = [
    {
      label: '逾期图书总量',
      value: Math.round((kpiData?.totalBorrows || 0) * (kpiData?.overdueRate || 0) / 100),
      suffix: '册',
      icon: AlertTriangle,
      color: 'text-danger-600 bg-danger-50',
    },
    {
      label: '逾期率',
      value: kpiData?.overdueRate || 0,
      suffix: '%',
      icon: TrendingDown,
      color: 'text-accent-600 bg-accent-50',
    },
    {
      label: '涉及分馆',
      value: 5,
      suffix: '个',
      icon: MapPin,
      color: 'text-primary-600 bg-primary-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 font-display">逾期分析</h2>
        <p className="text-sm text-gray-500 mt-1">逾期热区分布及各分馆逾期情况分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overdueStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 card-hover"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 font-display">
                  {stat.value}
                  <span className="text-sm text-gray-500 font-normal ml-1">{stat.suffix}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartCard
          title="逾期热区分布"
          subtitle="各分馆不同时段的逾期记录分布热力图"
          loading={loading.heatmap}
          error={errors.heatmap as string}
          sampleSize={overdueHeatmap.length}
        >
          <OverdueHeatmapChart data={overdueHeatmap} loading={loading.heatmap} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="逾期原因分析" subtitle="常见逾期原因分布">
          <div className="space-y-4">
            {[
              { reason: '忘记归还日期', percentage: 45, color: 'bg-danger-500' },
              { reason: '出差/旅行', percentage: 25, color: 'bg-accent-500' },
              { reason: '图书未读完', percentage: 18, color: 'bg-primary-500' },
              { reason: '丢失/损坏', percentage: 8, color: 'bg-purple-500' },
              { reason: '其他原因', percentage: 4, color: 'bg-gray-400' },
            ].map((item) => (
              <div key={item.reason}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.reason}</span>
                  <span className="font-medium text-gray-800">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="逾期处理建议" subtitle="降低逾期率的改进措施">
          <div className="space-y-3">
            {[
              { title: '提前提醒', desc: '借阅到期前3天发送短信/邮件提醒' },
              { title: '续借便利', desc: '支持线上一键续借，延长借阅期限' },
              { title: '逾期分级', desc: '轻度逾期仅提醒，重度逾期暂停借书权限' },
              { title: '预约优先', desc: '有预约的图书逾期不支持续借' },
            ].map((item, index) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
