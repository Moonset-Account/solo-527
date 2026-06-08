'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { getWaterfallData } from '@/lib/mock-data';
import { WaterfallItem } from '@/lib/types';

interface DelayWaterfallProps {
  workOrderId: string;
}

export default function DelayWaterfall({ workOrderId }: DelayWaterfallProps) {
  const rawData = getWaterfallData(workOrderId);

  const cumulative: Array<WaterfallItem & { base: number }> = [];
  let runningBase = 0;
  rawData.forEach((item, i) => {
    if (i === 0) {
      cumulative.push({ ...item, base: 0 });
    } else {
      cumulative.push({ ...item, base: runningBase });
      runningBase += item.value;
    }
  });

  const chartData = cumulative.map((item) => ({
    name: item.name,
    base: item.base,
    value: item.value,
    total: item.base + item.value,
    fill: item.fill,
    category: item.category,
  }));

  const categoryLabels: Record<string, string> = {
    delivery: '交期基准',
    process: '工序延期',
    capacity: '产能不足',
    material: '缺料等待',
    equipment: '设备停机',
    rush_order: '插单影响',
    cross_shop: '跨车间转单',
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-white font-semibold text-base mb-4">延期瀑布图</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="20%">
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} label={{ value: '小时', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8, color: '#f1f5f9' }}
            formatter={((value: number | string, name: string) => {
              if (name === 'base') return [String(value), '起始'];
              return [`${value}h`, '延期时长'];
            }) as never}
          />
          <Legend formatter={(value) => categoryLabels[value] || value} />
          <Bar dataKey="base" stackId="stack" fill="transparent" />
          <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(categoryLabels).slice(1).map(([key, label]) => {
          const item = rawData.find((d) => d.category === key);
          return (
            <span key={key} className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item?.fill || '#666' }} />
              {label}: {item?.value || 0}h
            </span>
          );
        })}
      </div>
    </div>
  );
}
