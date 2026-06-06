import { useMemo } from 'react';
import type { HourlyData } from '@shared/types';

interface HourlyHeatmapProps {
  data: HourlyData[];
}

export default function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  const maxTrips = useMemo(() => Math.max(...data.map(d => d.trips), 1), [data]);

  const getColor = (value: number) => {
    const ratio = value / maxTrips;
    if (ratio < 0.2) return 'bg-emerald-900/40';
    if (ratio < 0.4) return 'bg-emerald-700/50';
    if (ratio < 0.6) return 'bg-accent-cyan/50';
    if (ratio < 0.8) return 'bg-accent-orange/60';
    return 'bg-red-500/60';
  };

  const isPeakHour = (hour: number) => {
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-1">
        {data.map((d) => (
          <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t ${getColor(d.trips)} transition-all hover:scale-y-110 hover:brightness-125 cursor-pointer relative group`}
              style={{ height: `${Math.max((d.trips / maxTrips) * 120, 4)}px` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-gray-700">
                {d.trips} 次骑行
              </div>
            </div>
            <span className={`text-xs ${isPeakHour(d.hour) ? 'text-accent-orange font-medium' : 'text-gray-500'}`}>
              {d.hour}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-dark-border">
        <span>0时</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-accent-orange"></span>
            <span>早晚高峰</span>
          </div>
        </div>
        <span>23时</span>
      </div>
    </div>
  );
}
