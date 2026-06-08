import { useEffect, useState, useMemo } from 'react';
import type { PerformanceStats } from '../../types/game';

interface PerfPanelProps {
  getStats: () => PerformanceStats;
  enabled: boolean;
}

export function PerfPanel({ getStats, enabled }: PerfPanelProps) {
  const [stats, setStats] = useState<PerformanceStats>(() => getStats());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setStats(getStats()), 250);
    return () => clearInterval(id);
  }, [enabled, getStats]);
  const chartData = useMemo(() => ({
    fpsColor: stats.fps >= 55 ? 'text-emerald-400' : stats.fps >= 30 ? 'text-amber-400' : 'text-rose-400',
  }), [stats.fps]);
  if (!enabled) return null;
  return (
    <div className="absolute top-4 right-4 z-50 w-56 rounded-xl bg-slate-900/85 border border-slate-600/50 backdrop-blur-md p-3 shadow-2xl font-mono text-xs">
      <div className="flex items-center justify-between mb-2 border-b border-slate-700/60 pb-1.5">
        <span className="text-slate-400">PERFORMANCE</span>
        <span className={chartData.fpsColor + ' text-sm font-bold'}>{stats.fps.toFixed(0)} FPS</span>
      </div>
      <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-slate-300">
        <span className="text-slate-500">帧时间</span>
        <span className="text-right tabular-nums">{stats.frameTime.toFixed(1)} ms</span>
        <span className="text-slate-500">最小FPS</span>
        <span className="text-right tabular-nums">{stats.minFps}</span>
        <span className="text-slate-500">平均FPS</span>
        <span className="text-right tabular-nums">{stats.avgFps}</span>
        <span className="text-slate-500">最大FPS</span>
        <span className="text-right tabular-nums">{stats.maxFps}</span>
        <span className="text-slate-500">粒子数</span>
        <span className="text-right tabular-nums">{stats.particles}</span>
        <span className="text-slate-500">DrawCall</span>
        <span className="text-right tabular-nums">{stats.drawCalls}</span>
        {stats.memory > 0 && (
          <>
            <span className="text-slate-500">内存</span>
            <span className="text-right tabular-nums">{stats.memory.toFixed(0)} MB</span>
          </>
        )}
      </div>
    </div>
  );
}
