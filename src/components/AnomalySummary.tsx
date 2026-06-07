import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/useDashboardStore';
import type { Anomaly, AnomalyLevel, ViewPerspective } from '../../shared/types';

const levelConfig: Record<AnomalyLevel, { border: string; icon: React.ElementType; badge: string }> = {
  critical: { border: 'border-l-[#EF4444]', icon: AlertOctagon, badge: 'bg-red-500/20 text-red-400' },
  warning: { border: 'border-l-[#F59E0B]', icon: AlertTriangle, badge: 'bg-amber-500/20 text-amber-400' },
  info: { border: 'border-l-[#64748B]', icon: Info, badge: 'bg-slate-500/20 text-slate-400' },
};

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const setPerspective = useDashboardStore((s) => s.setPerspective);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const config = levelConfig[anomaly.level];
  const Icon = config.icon;

  const deviation = ((anomaly.currentValue - anomaly.expectedValue) / anomaly.expectedValue) * 100;
  const isAbove = anomaly.currentValue > anomaly.expectedValue;

  return (
    <button
      type="button"
      onClick={() => {
        setPerspective(anomaly.relatedView as ViewPerspective);
        setFilter(anomaly.relatedFilter);
      }}
      className={cn(
        'group flex w-72 shrink-0 flex-col gap-2 rounded-lg border-l-4 bg-slate-800/60 p-4 text-left backdrop-blur-sm transition-all hover:bg-slate-700/60',
        config.border,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-sans text-sm font-bold text-slate-200">{anomaly.title}</span>
        <span className={cn('flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs', config.badge)}>
          <Icon className="h-3 w-3" />
          {anomaly.level === 'critical' ? '严重' : anomaly.level === 'warning' ? '警告' : '提示'}
        </span>
      </div>
      <p className="font-sans text-xs text-slate-400 line-clamp-2">{anomaly.description}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-lg font-semibold text-slate-200">{anomaly.currentValue}</span>
        <span className="font-sans text-xs text-slate-500">/ 预期</span>
        <span className="font-mono text-sm text-slate-400">{anomaly.expectedValue}</span>
      </div>
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'font-mono text-xs font-medium',
            anomaly.level === 'critical'
              ? 'text-red-400'
              : anomaly.level === 'warning'
                ? 'text-amber-400'
                : 'text-slate-400',
          )}
        >
          {isAbove ? '+' : ''}
          {deviation.toFixed(1)}%
        </span>
        <span className="font-sans text-xs text-slate-500">偏差</span>
      </div>
    </button>
  );
}

function AnomalySkeleton() {
  return (
    <div className="flex w-72 shrink-0 animate-pulse flex-col gap-3 rounded-lg border-l-4 border-l-slate-600 bg-slate-800/60 p-4">
      <div className="h-4 w-3/4 rounded bg-slate-700" />
      <div className="h-3 w-full rounded bg-slate-700" />
      <div className="h-3 w-2/3 rounded bg-slate-700" />
      <div className="h-5 w-1/3 rounded bg-slate-700" />
    </div>
  );
}

export default function AnomalySummary() {
  const anomalies = useDashboardStore((s) => s.anomalies);
  const loading = useDashboardStore((s) => s.loading.anomalies);
  const fetchAnomaliesData = useDashboardStore((s) => s.fetchAnomaliesData);
  const filterParams = useDashboardStore((s) => s.filterParams);

  useEffect(() => {
    fetchAnomaliesData();
  }, [filterParams, fetchAnomaliesData]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
        {Array.from({ length: 4 }).map((_, i) => (
          <AnomalySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
        <span className="font-sans text-sm text-slate-400">当前无异常指标</span>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
      {anomalies.map((anomaly) => (
        <AnomalyCard key={anomaly.id} anomaly={anomaly} />
      ))}
    </div>
  );
}
