import { useGameStore } from '@/store/useGameStore';
import {
  Activity,
  Timer,
  Gauge,
  Bus,
  TrendingUp,
  Target,
  AlertTriangle,
} from 'lucide-react';

export function HUD() {
  const {
    currentMetrics,
    currentLevel,
    timeElapsed,
    status,
    unlockedLevels,
  } = useGameStore();

  const duration = currentLevel?.duration || 60;
  const progress = Math.min(100, (timeElapsed / duration) * 100);
  const timeLeft = Math.max(0, duration - timeElapsed);

  const metrics = [
    {
      icon: Activity,
      label: '拥堵指数',
      value: currentMetrics.congestionIndex.toFixed(0),
      unit: '',
      max: 100,
      target: currentLevel?.targetConditions.find(
        (t) => t.type === 'congestion_below'
      )?.value,
      better: 'lower' as const,
      color: currentMetrics.congestionIndex < 40
        ? '#7bed9f'
        : currentMetrics.congestionIndex < 65
          ? '#ffd93d'
          : '#ff6b6b',
    },
    {
      icon: Timer,
      label: '平均等待',
      value: currentMetrics.avgWaitingTime.toFixed(1),
      unit: 's',
      max: 50,
      target: currentLevel?.targetConditions.find(
        (t) => t.type === 'avg_wait_below'
      )?.value,
      better: 'lower' as const,
      color: currentMetrics.avgWaitingTime < 15
        ? '#7bed9f'
        : currentMetrics.avgWaitingTime < 30
          ? '#ffd93d'
          : '#ff6b6b',
    },
    {
      icon: Gauge,
      label: '平均车速',
      value: currentMetrics.avgSpeed.toFixed(1),
      unit: 'm/s',
      max: 10,
      target: null,
      better: 'higher' as const,
      color: '#4ecdc4',
    },
    {
      icon: Bus,
      label: '公交准点',
      value: currentMetrics.busOnTimeRate.toFixed(0),
      unit: '%',
      max: 100,
      target: currentLevel?.targetConditions.find(
        (t) => t.type === 'bus_on_time_above'
      )?.value,
      better: 'higher' as const,
      color: '#4ecdc4',
    },
    {
      icon: TrendingUp,
      label: '通过车辆',
      value: currentMetrics.throughput.toString(),
      unit: '辆',
      target: currentLevel?.targetConditions.find(
        (t) => t.type === 'throughput_above'
      )?.value,
      better: 'higher' as const,
      color: '#a78bfa',
    },
    {
      icon: Activity,
      label: '当前车辆',
      value: currentMetrics.vehicleCount.toString(),
      unit: '辆',
      target: null,
      better: 'neutral' as const,
      color: '#fbbf24',
    },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-40rem)] max-w-3xl z-10 pointer-events-auto">
      <div
        className="absolute top-1 left-4 right-4 h-2 rounded-full overflow-hidden bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 -translate-y-full -mb-3"
        id="time-indicator"
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-lg px-2 rounded-full bg-slate-900/60">
            {formatTime(timeLeft)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-slate-900/80 rounded-2xl p-4 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        <div className="grid grid-cols-6 gap-3">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {status === 'playing' && currentLevel?.targetConditions.length && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">通关目标</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentLevel.targetConditions.map((t, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs bg-slate-800/60 border border-slate-600/50 text-slate-300"
                >
                  {t.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-red-300 font-bold text-sm">检测到严重拥堵</p>
              <p className="text-red-400/80 text-xs">建议调整红绿灯配时以缓解交通压力</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: any;
  label: string;
  value: string;
  unit: string;
  color: string;
  target?: number;
  max?: number;
  better: 'lower' | 'higher' | 'neutral';
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  target,
  max = 100,
  better,
}: MetricCardProps) {
  const numValue = parseFloat(value);
  const percent = Math.min(100, (numValue / max) * 100);

  let statusColor = 'text-slate-400';
  let statusIcon = null;
  if (target != null) {
    const met = better === 'lower'
      ? numValue < target
      : better === 'higher'
        ? numValue >= target
        : true;
    statusColor = met ? 'text-emerald-400' : 'text-rose-400';
    statusIcon = met ? '✓' : '!';
  }

  return (
    <div className="relative rounded-xl bg-slate-800/50 border border-slate-700/40 p-3 overflow-hidden group hover:border-slate-600/60 transition-all">
      <div
        className="absolute top-0 left-0 h-0.5 transition-all"
        style={{ width: `${percent}%`, background: color, boxShadow: `0 0 12px ${color}60` }}
      />
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </span>
        {statusIcon && (
          <span className={`ml-auto text-xs font-bold ${statusColor}`}>{statusIcon}</span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-xl font-bold tabular-nums leading-none"
          style={{ color, fontFamily: 'Orbitron, sans-serif' }}
        >
          {value}
        </span>
        <span className="text-[10px] text-slate-500 font-medium">{unit}</span>
      </div>
      {target != null && (
        <div className="mt-1 text-[10px] text-slate-500">
          目标: {better === 'lower' ? '<' : better === 'higher' ? '≥' : ''} {target}
          {unit}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
