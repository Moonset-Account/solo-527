import { useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { useDashboardStore } from '../store/useDashboardStore';
import { cn } from '../lib/utils';

const SENSITIVE_CATEGORY = '私密养护';

const CATEGORY_COLORS: Record<string, string> = {
  '注射美容': '#10B981',
  '光电美肤': '#3B82F6',
  '私密养护': '#8B5CF6',
  '眼部整形': '#F59E0B',
  '鼻部整形': '#EF4444',
  '抗衰紧致': '#06B6D4',
};

function SkeletonBlock() {
  return (
    <div className="grid grid-cols-3 gap-4 animate-pulse">
      <div className="col-span-2 bg-[#1e293b]/60 rounded-lg p-4 space-y-4">
        <div className="h-4 w-36 bg-[#334155] rounded" />
        <div className="h-56 bg-[#334155] rounded" />
      </div>
      <div className="row-span-2 bg-[#1e293b]/60 rounded-lg p-4 space-y-4">
        <div className="h-4 w-32 bg-[#334155] rounded" />
        <div className="h-64 bg-[#334155] rounded" />
      </div>
      <div className="col-span-2 bg-[#1e293b]/60 rounded-lg p-4 space-y-4">
        <div className="h-4 w-40 bg-[#334155] rounded" />
        <div className="h-48 bg-[#334155] rounded" />
      </div>
    </div>
  );
}

export default function FollowUpTrendView() {
  const followUpData = useDashboardStore((s) => s.followUpData);
  const loading = useDashboardStore((s) => s.loading);
  const fetchFollowUpTrendData = useDashboardStore((s) => s.fetchFollowUpTrendData);
  const filterParams = useDashboardStore((s) => s.filterParams);

  useEffect(() => {
    fetchFollowUpTrendData();
  }, [filterParams, fetchFollowUpTrendData]);

  if (loading.followUpTrend) return <SkeletonBlock />;

  const monthly = (followUpData?.monthly ?? []).map((m) => ({
    ...m,
    rate: +(m.followUpRate * 100).toFixed(1),
  }));

  const intervalDistribution = followUpData?.intervalDistribution ?? [];

  const categoryChartData = (followUpData?.categoryBreakdown ?? []).map((c) => ({
    category: c.category,
    rate: +(c.followUpRate * 100).toFixed(1),
    isSensitive: c.category === SENSITIVE_CATEGORY,
  }));

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className={cn('col-span-2 bg-[#1e293b]/60 rounded-lg p-4')}>
        <h3 className="text-[#e2e8f0] font-sans text-sm font-medium mb-4">复诊率趋势</h3>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={monthly} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number, name: string) => {
                if (name === 'rate') return [`${value}%`, '复诊率'];
                return [value, name];
              }}
            />
            <Area type="monotone" dataKey="rate" stroke="none" fill="url(#rateGradient)" />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#10B981', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className={cn('row-span-2 bg-[#1e293b]/60 rounded-lg p-4')}>
        <h3 className="text-[#e2e8f0] font-sans text-sm font-medium mb-4">项目复诊关联</h3>
        <ResponsiveContainer width="100%" height={categoryChartData.length * 44 + 20}>
          <BarChart
            data={categoryChartData}
            layout="vertical"
            margin={{ left: 12, right: 52, top: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fill: '#e2e8f0', fontSize: 11 }}
              width={64}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number, _name: string, props: { payload?: { isSensitive?: boolean } }) => {
                if (props.payload?.isSensitive) return ['***', '复诊率'];
                return [`${value}%`, '复诊率'];
              }}
            />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
              {categoryChartData.map((entry) => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? '#10B981'} />
              ))}
              <LabelList
                dataKey="rate"
                position="right"
                content={({ x, y, width, height, index }) => {
                  const item = categoryChartData[index ?? 0];
                  if (!item) return null;
                  const text = item.isSensitive ? '***' : `${item.rate}%`;
                  const nx = Number(x ?? 0);
                  const ny = Number(y ?? 0);
                  const nw = Number(width ?? 0);
                  const nh = Number(height ?? 0);
                  return (
                    <text
                      x={nx + nw + 8}
                      y={ny + (nh + 4) / 2}
                      fill="#e2e8f0"
                      fontSize={11}
                      fontFamily="JetBrains Mono"
                      dominantBaseline="middle"
                    >
                      {text}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={cn('col-span-2 bg-[#1e293b]/60 rounded-lg p-4')}>
        <h3 className="text-[#e2e8f0] font-sans text-sm font-medium mb-4">复诊间隔分布</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={intervalDistribution} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number) => [value, '人数']}
            />
            <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
