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
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/useDashboardStore';

const BAR_COLORS = [
  '#10B981', '#22C55E', '#34D399', '#4ADE80',
  '#6EE7B7', '#86EFAC', '#A7F3D0', '#BBF7D0',
];

interface ChannelTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      conversionRate: number;
      visitRate: number;
      dealRate: number;
      rank: number;
      prevRank: number;
    };
  }>;
}

function ChannelTooltip({ active, payload }: ChannelTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, conversionRate, visitRate, dealRate } = payload[0].payload;

  return (
    <div className={cn('rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl')}>
      <p className={cn('mb-2 font-sans text-sm font-semibold text-slate-100')}>{name}</p>
      <div className={cn('space-y-1 font-mono text-xs')}>
        <p className={cn('text-slate-300')}>
          转化率: <span className={cn('text-emerald-400')}>{(conversionRate * 100).toFixed(1)}%</span>
        </p>
        <p className={cn('text-slate-300')}>
          到店率: <span className={cn('text-slate-100')}>{(visitRate * 100).toFixed(1)}%</span>
        </p>
        <p className={cn('text-slate-300')}>
          成单率: <span className={cn('text-slate-100')}>{(dealRate * 100).toFixed(1)}%</span>
        </p>
      </div>
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className={cn('flex items-center gap-4')}>
      <div className={cn('h-4 w-20 animate-pulse rounded bg-slate-700')} />
      <div className={cn('h-7 flex-1 animate-pulse rounded bg-slate-700')} />
      <div className={cn('h-4 w-12 animate-pulse rounded bg-slate-700')} />
    </div>
  );
}

function SkeletonMiniCard() {
  return (
    <div className={cn('flex flex-col gap-2 rounded-lg bg-slate-900/60 p-4')}>
      <div className={cn('h-3 w-16 animate-pulse rounded bg-slate-700')} />
      <div className={cn('h-5 w-24 animate-pulse rounded bg-slate-700')} />
      <div className={cn('h-3 w-12 animate-pulse rounded bg-slate-700')} />
    </div>
  );
}

export default function ChannelQualityView() {
  const { channelData, loading, fetchChannelQualityData, filterParams } = useDashboardStore();

  useEffect(() => {
    fetchChannelQualityData();
  }, [filterParams, fetchChannelQualityData]);

  const channels = useMemo(() => {
    if (!channelData?.channels) return [];
    return [...channelData.channels].sort((a, b) => b.conversionRate - a.conversionRate);
  }, [channelData]);

  const topConversion = useMemo(() => {
    if (!channels.length) return null;
    return channels.reduce((best, ch) => (ch.conversionRate > best.conversionRate ? ch : best), channels[0]);
  }, [channels]);

  const topVisit = useMemo(() => {
    if (!channels.length) return null;
    return channels.reduce((best, ch) => (ch.visitRate > best.visitRate ? ch : best), channels[0]);
  }, [channels]);

  const topDeal = useMemo(() => {
    if (!channels.length) return null;
    return channels.reduce((best, ch) => (ch.dealRate > best.dealRate ? ch : best), channels[0]);
  }, [channels]);

  if (loading.channelQuality) {
    return (
      <div className={cn('rounded-xl border border-slate-700/50 bg-slate-800/60 p-6')}>
        <div className={cn('mb-4 h-6 w-40 animate-pulse rounded bg-slate-700')} />
        <div className={cn('space-y-3')}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBar key={i} />
          ))}
        </div>
        <div className={cn('mt-6 grid grid-cols-3 gap-4')}>
          <SkeletonMiniCard />
          <SkeletonMiniCard />
          <SkeletonMiniCard />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-slate-700/50 bg-slate-800/60 p-6')}>
      <ResponsiveContainer width="100%" height={channels.length * 48 + 20}>
        <BarChart
          data={channels}
          layout="vertical"
          margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={({ x, y, payload }) => {
              const channel = channels.find((c) => c.name === payload.value);
              const rankUp = channel && channel.rank < channel.prevRank;
              const rankDown = channel && channel.rank > channel.prevRank;

              return (
                <g>
                  <text
                    x={x}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    fill="#CBD5E1"
                    fontSize={13}
                    fontFamily="Noto Sans SC"
                  >
                    {payload.value}
                  </text>
                  {rankUp && (
                    <text
                      x={x + 6}
                      y={y}
                      dy={4}
                      fill="#10B981"
                      fontSize={11}
                      fontFamily="JetBrains Mono"
                    >
                      ▲
                    </text>
                  )}
                  {rankDown && (
                    <text
                      x={x + 6}
                      y={y}
                      dy={4}
                      fill="#EF4444"
                      fontSize={11}
                      fontFamily="JetBrains Mono"
                    >
                      ▼
                    </text>
                  )}
                </g>
              );
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChannelTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
          <Bar dataKey="conversionRate" radius={[0, 6, 6, 0]} barSize={24}>
            {channels.map((_, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className={cn('mt-6 grid grid-cols-3 gap-4')}>
        <div className={cn('rounded-lg bg-slate-900/60 p-4')}>
          <p className={cn('font-sans text-xs text-slate-400')}>转化率最高</p>
          {topConversion && (
            <>
              <p className={cn('font-mono text-lg font-bold text-emerald-400')}>
                {(topConversion.conversionRate * 100).toFixed(1)}%
              </p>
              <p className={cn('font-sans text-xs text-slate-500')}>{topConversion.name}</p>
            </>
          )}
        </div>
        <div className={cn('rounded-lg bg-slate-900/60 p-4')}>
          <p className={cn('font-sans text-xs text-slate-400')}>到店率最高</p>
          {topVisit && (
            <>
              <p className={cn('font-mono text-lg font-bold text-emerald-400')}>
                {(topVisit.visitRate * 100).toFixed(1)}%
              </p>
              <p className={cn('font-sans text-xs text-slate-500')}>{topVisit.name}</p>
            </>
          )}
        </div>
        <div className={cn('rounded-lg bg-slate-900/60 p-4')}>
          <p className={cn('font-sans text-xs text-slate-400')}>成单率最高</p>
          {topDeal && (
            <>
              <p className={cn('font-mono text-lg font-bold text-emerald-400')}>
                {(topDeal.dealRate * 100).toFixed(1)}%
              </p>
              <p className={cn('font-sans text-xs text-slate-500')}>{topDeal.name}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
