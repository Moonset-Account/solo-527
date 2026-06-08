import { cn } from './GameButton';

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
  className?: string;
  accent?: string;
}

export function Slider({
  value, onChange, min = 0, max = 100, step = 1,
  label, suffix = '', className, accent = 'cyan',
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackId = `slider-${label}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className={cn('w-full', className)}>
      {(label || suffix) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-slate-300 font-medium">{label}</span>}
          <span className={cn(
            'text-sm font-semibold tabular-nums',
            accent === 'cyan' ? 'text-cyan-300' :
              accent === 'amber' ? 'text-amber-300' :
              accent === 'rose' ? 'text-rose-300' :
              accent === 'emerald' ? 'text-emerald-300' : 'text-cyan-300',
          )}>
            {value.toFixed(step < 1 ? 1 : 0)}{suffix}
          </span>
        </div>
      )}
      <div className="relative h-7 flex items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-slate-700/80 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-100 rounded-full',
              accent === 'cyan' ? 'bg-gradient-to-r from-cyan-500 to-cyan-300' :
                accent === 'amber' ? 'bg-gradient-to-r from-amber-500 to-amber-300' :
                accent === 'rose' ? 'bg-gradient-to-r from-rose-500 to-rose-300' :
                accent === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-300' :
                'bg-gradient-to-r from-cyan-500 to-cyan-300',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          id={trackId}
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="relative w-full h-7 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-cyan-400
            [&::-webkit-slider-thumb]:-mt-[3px]
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:scale-95
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-cyan-400"
        />
      </div>
    </div>
  );
}
