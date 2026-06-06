import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { ChartCard } from '../components/charts/ChartCard';
import { WaitTimeChart } from '../components/charts/WaitTimeChart';
import { Clock, TrendingUp, CheckCircle, BookOpen } from 'lucide-react';

export default function Reservation() {
  const { reservationAnalysis, loading, errors, filters, loadReservationAnalysis } =
    useDashboardStore();

  useEffect(() => {
    loadReservationAnalysis();
  }, [filters]);

  const stats = [
    {
      label: '平均等待天数',
      value: reservationAnalysis?.averageWaitDays || 0,
      suffix: '天',
      icon: Clock,
      color: 'text-primary-600 bg-primary-50',
    },
    {
      label: '总预约量',
      value: reservationAnalysis?.totalReservations || 0,
      suffix: '笔',
      icon: BookOpen,
      color: 'text-accent-600 bg-accent-50',
    },
    {
      label: '预约完成率',
      value: reservationAnalysis?.completedRate || 0,
      suffix: '%',
      icon: CheckCircle,
      color: 'text-success-600 bg-success-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 font-display">预约分析</h2>
        <p className="text-sm text-gray-500 mt-1">预约等待时长、完成率及热门预约分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="预约等待时长分布"
          subtitle="不同等待时间段的预约数量分布"
          loading={loading.reservation}
          error={errors.reservation as string}
          sampleSize={reservationAnalysis?.distribution.length}
        >
          <WaitTimeChart
            data={reservationAnalysis?.distribution || []}
            loading={loading.reservation}
          />
        </ChartCard>

        <ChartCard
          title="热门预约图书 TOP 10"
          subtitle="预约量最高的图书排行"
          loading={loading.reservation}
          error={errors.reservation as string}
        >
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {reservationAnalysis?.popularBooks.map((book, index) => (
              <div
                key={book.title}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index < 3
                      ? 'bg-accent-100 text-accent-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary-600 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  {book.reservationCount}
                </div>
              </div>
            ))}
            {(!reservationAnalysis?.popularBooks || reservationAnalysis.popularBooks.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">暂无数据</p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
