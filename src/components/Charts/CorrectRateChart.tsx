import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import { CorrectRateItem } from '../../data/types';
import { COLORS } from '../../data/constants';

interface CorrectRateChartProps {
  data: CorrectRateItem[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3">
        <p className="font-semibold text-gray-800 mb-1">{item.chapterName}</p>
        <p className="text-sm text-gray-600">
          正确率: {(item.correctRate * 100).toFixed(1)}%
        </p>
        <p className="text-sm text-gray-600">答题次数: {item.totalAttempts} 次</p>
        {item.isAbnormal && (
          <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
            <AlertTriangle size={12} />
            {item.abnormalReason}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const CorrectRateChart: React.FC<CorrectRateChartProps> = ({ data }) => {
  const avgRate = data.length > 0
    ? data.reduce((sum, d) => sum + d.correctRate, 0) / data.length
    : 0;
  
  const chartData = data.map((item) => ({
    ...item,
    displayRate: item.correctRate * 100,
  }));
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-600" />
            章节题目正确率
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            平均正确率: {(avgRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            正常
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            异常
          </span>
        </div>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
            <XAxis
              dataKey="chapterName"
              tick={{ fontSize: 11, fill: '#86909C' }}
              angle={-30}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#86909C' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgRate * 100}
              stroke={COLORS.warning}
              strokeDasharray="5 5"
              label={{
                value: '平均值',
                position: 'insideTopRight',
                fill: COLORS.warning,
                fontSize: 11,
              }}
            />
            <Bar dataKey="displayRate" radius={[4, 4, 0, 0]} animationDuration={500}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isAbnormal ? COLORS.danger : COLORS.primary}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
