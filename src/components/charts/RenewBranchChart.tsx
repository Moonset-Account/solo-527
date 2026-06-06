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

export default function RenewBranchChart() {
  const { renewByBranch, loadRenewByBranch, filters, loading } = useDashboardStore();

  useEffect(() => {
    loadRenewByBranch();
  }, [filters]);

  return (
    <ChartCard
      title="分馆续借对比"
      subtitle="各分馆续借次数与平均续借次数"
      sampleSize={renewByBranch.reduce((a, b) => a + b.totalRenews, 0)}
      loading={loading.renewBranch}
    >
      {renewByBranch.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
          暂无分馆续借数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={renewByBranch}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="branch"
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
            <Bar
              yAxisId="left"
              dataKey="totalRenews"
              fill="#0d9488"
              radius={[4, 4, 0, 0]}
              name="总续借次数"
            />
            <Bar
              yAxisId="right"
              dataKey="avgRenewsPerBook"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
              name="平均续借次数/本"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
