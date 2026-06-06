import { useEffect } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { ChartCard } from './ChartCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ActivityTrendChart() {
  const { activityTrends, loadActivityTrends, filters, loading } = useDashboardStore();

  useEffect(() => {
    loadActivityTrends();
  }, [filters]);

  return (
    <ChartCard
      title="活动参与趋势"
      subtitle="各月份活动场次与参与人次变化"
      sampleSize={activityTrends.reduce((a, b) => a + b.participationCount, 0)}
      loading={loading.activityTrends}
    >
      {activityTrends.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
          暂无活动参与数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={activityTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="participationCount"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ fill: '#ec4899', strokeWidth: 2 }}
              name="参与人次"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="activityCount"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
              name="活动场次"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
