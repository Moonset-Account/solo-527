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

export default function RenewTrendChart() {
  const { renewTrends, loadRenewTrends, filters, loading } = useDashboardStore();

  useEffect(() => {
    loadRenewTrends();
  }, [filters]);

  return (
    <ChartCard
      title="续借趋势"
      subtitle="各月份续借量与续借率变化"
      sampleSize={renewTrends.length > 0 ? renewTrends.reduce((a, b) => a + b.renewCount, 0) : 0}
      loading={loading.renewTrends}
    >
      {renewTrends.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
          暂无续借数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={renewTrends}>
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
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
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
              dataKey="renewCount"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ fill: '#0d9488', strokeWidth: 2 }}
              name="续借次数"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="renewRate"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2 }}
              name="续借率(%)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
