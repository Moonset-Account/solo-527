import { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useDashboardStore } from '@/store/useDashboardStore';
import { cn } from '@/lib/utils';

const STAGE_KEYS = ['lead', 'consulted', 'appointed', 'visited', 'planned', 'paid', 'followed_up'] as const;

const STAGE_LABELS: Record<string, string> = {
  lead: '潜客',
  consulted: '已咨询',
  appointed: '已预约',
  visited: '已到店',
  planned: '已方案',
  paid: '已付款',
  followed_up: '已复诊',
};

function getHeatmapStyle(value: number): React.CSSProperties {
  if (value === 0) return { backgroundColor: '#1e293b' };
  if (value <= 5) return { backgroundColor: 'rgba(2, 44, 34, 0.3)' };
  if (value <= 15) return { backgroundColor: 'rgba(217, 119, 6, 0.4)' };
  return { backgroundColor: 'rgba(239, 68, 68, 0.5)' };
}

function SkeletonBlock() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-[#1e293b]/60 rounded-lg p-4 space-y-4">
        <div className="h-4 w-40 bg-[#334155] rounded" />
        <div className="h-56 bg-[#334155] rounded" />
      </div>
      <div className="bg-[#1e293b]/60 rounded-lg p-4 space-y-4">
        <div className="h-4 w-36 bg-[#334155] rounded" />
        <div className="h-48 bg-[#334155] rounded" />
      </div>
    </div>
  );
}

export default function ConsultantLoadView() {
  const consultantData = useDashboardStore((s) => s.consultantData);
  const loading = useDashboardStore((s) => s.loading);
  const fetchConsultantLoadData = useDashboardStore((s) => s.fetchConsultantLoadData);
  const filterParams = useDashboardStore((s) => s.filterParams);

  useEffect(() => {
    fetchConsultantLoadData();
  }, [filterParams, fetchConsultantLoadData]);

  if (loading.consultantLoad) return <SkeletonBlock />;

  const consultants = consultantData?.consultants ?? [];
  const chartData = consultants.map((c) => ({
    name: c.name,
    rate: +(c.conversionRate * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      <div className={cn('bg-[#1e293b]/60 rounded-lg p-4')}>
        <h3 className="text-[#e2e8f0] font-sans text-sm font-medium mb-4">顾问客户阶段分布</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-[#e2e8f0] font-sans text-xs font-medium text-left p-2 sticky left-0 bg-[#0f172a]">
                  顾问
                </th>
                {STAGE_KEYS.map((stage) => (
                  <th
                    key={stage}
                    className="text-[#94a3b8] font-sans text-xs font-medium p-2 text-center min-w-[64px]"
                  >
                    {STAGE_LABELS[stage]}
                  </th>
                ))}
                <th className="text-[#94a3b8] font-sans text-xs font-medium p-2 text-center">合计</th>
              </tr>
            </thead>
            <tbody>
              {consultants.map((c) => (
                <tr key={c.id}>
                  <td className="text-[#e2e8f0] font-sans text-xs p-2 sticky left-0 bg-[#0f172a]">
                    {c.name}
                  </td>
                  {STAGE_KEYS.map((stage) => {
                    const val = c.stageDistribution[stage] ?? 0;
                    return (
                      <td key={stage} className="text-center p-1" style={getHeatmapStyle(val)}>
                        <span className="font-mono text-xs text-[#e2e8f0]">{val}</span>
                      </td>
                    );
                  })}
                  <td className="text-center p-2">
                    <span className="font-mono text-xs text-emerald font-semibold">
                      {c.totalCustomers}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cn('bg-[#1e293b]/60 rounded-lg p-4')}>
        <h3 className="text-[#e2e8f0] font-sans text-sm font-medium mb-4">顾问转化率对比</h3>
        <ResponsiveContainer width="100%" height={Math.max(consultants.length * 44, 120)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 56, right: 56, top: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#e2e8f0', fontSize: 12 }}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number) => [`${value}%`, '转化率']}
            />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} fill="#10B981">
              <LabelList
                dataKey="rate"
                position="right"
                formatter={(value: number) => `${value}%`}
                style={{ fill: '#e2e8f0', fontSize: 12, fontFamily: 'JetBrains Mono' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
