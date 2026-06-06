import { useEffect } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { ChartCard } from './ChartCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ActivityTypeChart() {
  const { activityByType, loadActivityByType, filters, loading } = useDashboardStore();

  useEffect(() => {
    loadActivityByType();
  }, [filters]);

  return (
    <ChartCard
      title="活动类型分布"
      subtitle="不同类型活动的参与情况"
      sampleSize={activityByType.reduce((a, b) => a + b.participationCount, 0)}
      loading={loading.activityType}
    >
      {activityByType.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
          暂无活动类型数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={activityByType}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="type"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
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
            <Bar
              dataKey="participationCount"
              fill="#ec4899"
              radius={[4, 4, 0, 0]}
              name="参与人次"
            />
            <Bar
              dataKey="uniqueReaders"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              name="独立读者数"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
