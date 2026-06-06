import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { AgeGroupData } from '../../../shared/types.js';
import { ShieldCheck } from 'lucide-react';

interface AgeGroupChartProps {
  data: AgeGroupData[];
  loading?: boolean;
}

export function AgeGroupChart({ data, loading }: AgeGroupChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-gray-400">暂无数据</p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="ageGroup"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="totalBorrows" name="总借阅量" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isChildrenGroup ? '#8b5cf6' : '#3d699e'}
                />
              ))}
            </Bar>
            <Bar dataKey="readerCount" name="读者人数" radius={[4, 4, 0, 0]} fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.some((d) => d.isChildrenGroup) && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-800">少儿数据保护</p>
            <p className="text-xs text-purple-600 mt-0.5">
              12岁以下少儿读者数据已做聚合处理，不暴露个人阅读记录，仅展示统计汇总数据。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
