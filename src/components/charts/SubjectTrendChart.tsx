import { useState } from 'react';
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
import type { SubjectTrend } from '../../../shared/types.js';

const COLORS = [
  '#3d699e',
  '#f59e0b',
  '#22c55e',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

interface SubjectTrendChartProps {
  data: SubjectTrend[];
  loading?: boolean;
}

export function SubjectTrendChart({ data, loading }: SubjectTrendChartProps) {
  const [hiddenSubjects, setHiddenSubjects] = useState<string[]>([]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-gray-400">暂无数据</p>
      </div>
    );
  }

  const subjects = Object.keys(data[0] || {}).filter((k) => k !== 'date');

  const toggleSubject = (subject: string) => {
    setHiddenSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#64748b' }}
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
          <Legend
            onClick={(e) => toggleSubject(e.value)}
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          {subjects.map((subject, index) => (
            <Line
              key={subject}
              type="monotone"
              dataKey={subject}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
              hide={hiddenSubjects.includes(subject)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
