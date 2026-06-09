import { useGameStore } from '@/store/useGameStore';
import { Play, Pause, RotateCcw, Zap, Bus, Clock, Sliders } from 'lucide-react';

export function ControlPanel() {
  const {
    phaseConfig,
    setPhaseConfig,
    applyPhaseConfig,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    status,
    speedScale,
    setSpeedScale,
    attemptCount,
  } = useGameStore();

  const isSimulating = status === 'simulating';
  const isPaused = status === 'paused';

  const totalCycle =
    phaseConfig.nsGreen +
    phaseConfig.ewGreen +
    phaseConfig.yellow * 2 +
    phaseConfig.allRed * 2;

  return (
    <div className="absolute top-4 left-4 w-80 z-10 flex flex-col gap-3 pointer-events-auto">
      <div className="backdrop-blur-xl bg-slate-900/75 rounded-2xl p-5 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30">
              <Sliders className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-cyan-300 font-bold tracking-wide text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                配时控制
              </h3>
              <p className="text-slate-400 text-xs">第 {attemptCount} 次尝试</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-amber-500/30">
            <span className="text-amber-400 font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {totalCycle}s
            </span>
          </div>
        </div>

        <div id="timing-sliders" className="space-y-4">
          <TimingSlider
            label="南北绿灯"
            value={phaseConfig.nsGreen}
            min={5}
            max={60}
            color="#7bed9f"
            onChange={(v) => setPhaseConfig({ nsGreen: v })}
          />
          <TimingSlider
            label="东西绿灯"
            value={phaseConfig.ewGreen}
            min={5}
            max={60}
            color="#7bed9f"
            onChange={(v) => setPhaseConfig({ ewGreen: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TimingSlider
              label="黄灯"
              value={phaseConfig.yellow}
              min={2}
              max={5}
              color="#ffd93d"
              onChange={(v) => setPhaseConfig({ yellow: v })}
              compact
            />
            <TimingSlider
              label="全红清空"
              value={phaseConfig.allRed}
              min={1}
              max={5}
              color="#ff6b6b"
              onChange={(v) => setPhaseConfig({ allRed: v })}
              compact
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-700/50" id="bus-priority">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-slate-300 font-medium">公交优先</span>
            </div>
            <button
              onClick={() => setPhaseConfig({ busPriority: !phaseConfig.busPriority })}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                phaseConfig.busPriority
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                  phaseConfig.busPriority ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
          {phaseConfig.busPriority && (
            <div className="pl-2">
              <TimingSlider
                label="触发阈值"
                value={phaseConfig.busThreshold}
                min={1}
                max={6}
                color="#4ecdc4"
                onChange={(v) => setPhaseConfig({ busThreshold: v })}
                compact
                suffix="辆"
              />
            </div>
          )}
        </div>
      </div>

      <div className="backdrop-blur-xl bg-slate-900/75 rounded-2xl p-4 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">模拟速度</span>
          </div>
          <div className="flex gap-1">
            {[0.5, 1, 2, 3].map((sp) => (
              <button
                key={sp}
                onClick={() => setSpeedScale(sp)}
                className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                  speedScale === sp
                    ? 'bg-cyan-500 text-white shadow shadow-cyan-500/50'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="apply-button"
            onClick={applyPhaseConfig}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>应用配时</span>
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={isSimulating ? pauseSimulation : startSimulation}
            disabled={status !== 'simulating' && status !== 'paused'}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 text-slate-200 font-medium transition-all active:scale-95 disabled:opacity-40"
          >
            {isSimulating ? (
              <><Pause className="w-4 h-4" /> 暂停</>
            ) : (
              <><Play className="w-4 h-4" /> 继续</>
            )}
          </button>
          <button
            onClick={resetSimulation}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-amber-900/40 hover:border-amber-500/40 border border-slate-600/50 text-slate-200 font-medium transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
    </div>
  );
}

interface TimingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
  compact?: boolean;
  suffix?: string;
}

function TimingSlider({
  label,
  value,
  min,
  max,
  color,
  onChange,
  compact = false,
  suffix = 's',
}: TimingSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={compact ? '' : ''}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span
          className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-md bg-slate-800/60"
          style={{ color, fontFamily: 'Orbitron, sans-serif' }}
        >
          {value}{suffix}
        </span>
      </div>
      <div className="relative h-2 bg-slate-700/70 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${percent}%`, background: color, boxShadow: `0 0 10px ${color}50` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 pointer-events-none transition-all"
          style={{ left: `calc(${percent}% - 8px)`, borderColor: color }}
        />
      </div>
    </div>
  );
}
