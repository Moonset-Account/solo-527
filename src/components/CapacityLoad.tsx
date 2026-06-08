'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getCapacityBuckets } from '@/lib/mock-data';
import { useState } from 'react';
import { MaterialShortage } from '@/lib/types';

const shortages: MaterialShortage[] = [
  { materialCode: 'M-1001', materialName: '高强度钢板', shortQty: 200, eta: '2026-06-12', severity: 'critical' },
  { materialCode: 'M-1002', materialName: '铝合金型材', shortQty: 50, eta: '2026-06-10', severity: 'warning' },
  { materialCode: 'M-2001', materialName: '电子控制单元', shortQty: 15, eta: '2026-06-15', severity: 'critical' },
  { materialCode: 'M-2002', materialName: '液压管路', shortQty: 80, eta: '2026-06-11', severity: 'warning' },
  { materialCode: 'M-1003', materialName: '密封胶条', shortQty: 300, eta: '2026-06-09', severity: 'normal' },
];

const severityColors = {
  critical: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-slate-900',
  normal: 'bg-emerald-500 text-white',
};

const severityLabels = {
  critical: '紧急',
  warning: '预警',
  normal: '一般',
};

export default function CapacityLoad() {
  const [selectedDate, setSelectedDate] = useState('2026-06-08');
  const allBuckets = getCapacityBuckets();
  const buckets = allBuckets.filter((b) => b.date === selectedDate);

  const chartData = buckets.map((b) => ({
    name: b.workshopName,
    已用: b.usedCapacity,
    插单占用: b.rushOrderCapacity,
    可用: b.availableCapacity,
    总产能: b.totalCapacity,
    utilization: +((b.usedCapacity / b.totalCapacity) * 100).toFixed(1),
  }));

  const dates = [...new Set(allBuckets.map((b) => b.date))].sort();

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-base">产能负载聚合</h3>
        <div className="flex gap-1">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedDate === d ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {d.slice(5)}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8, color: '#f1f5f9' }}
          />
          <Bar dataKey="已用" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
          <Bar dataKey="插单占用" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} />
          <Bar dataKey="可用" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 mb-4 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />已用产能</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-pink-500" />插单占用</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" />可用产能</span>
      </div>

      <div className="border-t border-slate-700/50 pt-3">
        <h4 className="text-slate-300 text-sm font-medium mb-2">缺料标签</h4>
        <div className="flex flex-wrap gap-2">
          {shortages.map((s) => (
            <div key={s.materialCode} className="flex items-center gap-1.5 bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-600/30">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${severityColors[s.severity]}`}>
                {severityLabels[s.severity]}
              </span>
              <span className="text-slate-200 text-xs">{s.materialName}</span>
              <span className="text-slate-400 text-[10px]">缺{s.shortQty}</span>
              <span className="text-slate-500 text-[10px]">到{s.eta.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
