import { useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '../lib/utils';
import { useDashboardStore } from '../store/useDashboardStore';

const EMERALD_GRADIENTS = [
  '#10B981',
  '#22C55E',
  '#34D399',
  '#4ADE80',
  '#6EE7B7',
  '#86EFAC',
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      count: number;
      rate: number;
      prevRate: number;
    };
  }>;
}

function FunnelTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, count, rate, prevRate } = payload[0].payload;

  return (
    <div className={cn('rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl')}>
      <p className={cn('mb-2 font-sans text-sm font-semibold text-slate-100')}>{name}</p>
      <div className={cn('space-y-1 font-mono text-xs')}>
        <p className={cn('text-slate-300')}>
          数量: <span className={cn('text-slate-100')}>{count}</span>
        </p>
        <p className={cn('text-slate-300')}>
          转化率: <span className={cn('text-slate-100')}>{(rate * 100).toFixed(1)}%</span>
        </p>
        <p className={cn('text-slate-300')}>
          上期率: <span className={cn('text-slate-100')}>{(prevRate * 100).toFixed(1)}%</span>
        </p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className={cn('flex items-center gap-4')}>
      <div className={cn('h-4 w-12 animate-pulse rounded bg-slate-700')} />
      <div className={cn('h-8 flex-1 animate-pulse rounded bg-slate-700')} />
      <div className={cn('h-4 w-10 animate-pulse rounded bg-slate-700')} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={cn('flex flex-col gap-3 rounded-lg bg-slate-800/60 p-6')}>
      <div className={cn('h-5 w-32 animate-pulse rounded bg-slate-700')} />
      <div className={cn('h-8 w-20 animate-pulse rounded bg-slate-700')} />
    </div>
  );
}

export default function FunnelView() {
  const { funnelData, loading, fetchFunnelData, filterParams, perspective } = useDashboardStore();

  useEffect(() => {
    fetchFunnelData();
  }, [filterParams, fetchFunnelData]);

  const stages = funnelData?.stages ?? [];

  const kpis = useMemo(() => {
    if (!stages.length) return { totalConsultations: 0, overallRate: 0, biggestDrop: '-' };

    const totalConsultations = stages[0].count;
    const lastStage = stages[stages.length - 1];
    const overallRate = totalConsultations > 0 ? lastStage.count / totalConsultations : 0;

    let maxDrop = 0;
    let biggestDrop = stages[0].name;
    for (let i = 1; i < stages.length; i++) {
      const drop = stages[i - 1].rate - stages[i].rate;
      if (drop > maxDrop) {
        maxDrop = drop;
        biggestDrop = `${stages[i - 1].name}→${stages[i].name}`;
      }
    }

    return { totalConsultations, overallRate, biggestDrop };
  }, [stages]);

  if (loading.funnel) {
    return (
      <div className={cn('rounded-xl border border-slate-700/50 bg-slate-800/60 p-6')}>
        <div className={cn('mb-6 grid grid-cols-3 gap-4')}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className={cn('space-y-3')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-slate-700/50 bg-slate-800/60 p-6')}>
      <div className={cn('mb-4 grid grid-cols-3 gap-4')}>
        <div className={cn('rounded-lg bg-slate-900/60 p-4')}>
          <p className={cn('font-sans text-xs text-slate-400')}>总咨询量</p>
          <p className={cn('font-mono text-xl font-bold text-slate-200')}>{kpis.totalConsultations.toLocaleString()}</p>
        </div>
        <div className={cn('rounded-lg bg-slate-900/60 p-4')}>
          <p className={cn('font-sans text-xs text-slate-400')}>总转化率</p>
          <p className={cn('font-mono text-xl font-bold text-emerald-400')}>{(kpis.overallRate * 100).toFixed(1)}%</p>
        </div>
        <div className={cn('rounded-lg bg-slate-900/60 p-4')}>
          <p className={cn('font-sans text-xs text-slate-400')}>最大流失阶段</p>
          <p className={cn('font-mono text-xl font-bold text-coral')}>{kpis.biggestDrop}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={stages}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={60}
            tick={{ fill: '#CBD5E1', fontSize: 13, fontFamily: 'Noto Sans SC' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<FunnelTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
            {stages.map((_, index) => (
              <Cell key={index} fill={EMERALD_GRADIENTS[index % EMERALD_GRADIENTS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className={cn('mt-2 flex flex-col gap-1')}>
        {stages.map((stage) => (
          <div key={stage.name} className={cn('flex items-center justify-between px-1')}>
            <span className={cn('font-sans text-xs text-slate-500')}>{stage.name}</span>
            <div className={cn('flex items-center gap-2')}>
              <span className={cn('font-mono text-xs text-slate-300')}>{stage.count.toLocaleString()}</span>
              <span className={cn('font-mono text-xs', stage.rate >= stage.prevRate ? 'text-emerald-400' : 'text-coral')}>
                {(stage.rate * 100).toFixed(1)}%
                {stage.rate >= stage.prevRate ? ' ▲' : ' ▼'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
