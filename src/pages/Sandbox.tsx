import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { SceneRoot } from '@/scene/SceneRoot';
import type { Direction, MetricsSnapshot } from '@/types';
import { saveManager } from '@/game/SaveManager';
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Zap,
  Bus,
  Clock,
  Sliders,
  Sun,
  Moon,
  Activity,
  Timer,
  Gauge,
  TrendingUp,
  AlertCircle,
  Car,
} from 'lucide-react';

type TimeOfDay = 'day' | 'night';

interface SandboxPreset {
  name: string;
  spawnRate: number;
  bias: Record<Direction, number>;
  busRate: number;
  taxiRate: number;
}

const PRESETS: Record<string, SandboxPreset> = {
  balanced: {
    name: '均衡',
    spawnRate: 1.2,
    bias: { N: 0.25, S: 0.25, E: 0.25, W: 0.25 },
    busRate: 0.08,
    taxiRate: 0.12,
  },
  nsPeak: {
    name: '南北高峰',
    spawnRate: 2.0,
    bias: { N: 0.4, S: 0.4, E: 0.1, W: 0.1 },
    busRate: 0.1,
    taxiRate: 0.15,
  },
  ewPeak: {
    name: '东西高峰',
    spawnRate: 2.0,
    bias: { N: 0.1, S: 0.1, E: 0.4, W: 0.4 },
    busRate: 0.1,
    taxiRate: 0.15,
  },
  extreme: {
    name: '极端',
    spawnRate: 2.8,
    bias: { N: 0.3, S: 0.3, E: 0.2, W: 0.2 },
    busRate: 0.15,
    taxiRate: 0.2,
  },
};

const INTENSITY_LABELS = ['低', '中', '高', '极端'];
const INTENSITY_VALUES = [0.6, 1.2, 2.0, 2.8];

const emptyMetrics: MetricsSnapshot = {
  timestamp: 0,
  congestionIndex: 0,
  avgWaitingTime: 0,
  avgSpeed: 0,
  busOnTimeRate: 85,
  throughput: 0,
  queueLengths: {},
  vehicleCount: 0,
  busCount: 0,
};

export default function Sandbox() {
  const navigate = useNavigate();

  const {
    initSimulator,
    destroySimulator,
    status,
    timeElapsed,
    phaseConfig,
    setPhaseConfig,
    applyPhaseConfig,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    speedScale,
    setSpeedScale,
    setSpawnRate,
    setDirectionBias,
    setBusRate,
    setTaxiRate,
  } = useGameStore();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [lightState, setLightState] = useState<any>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [spawnRate, setSpawnRateLocal] = useState(1.2);
  const [directionBias, setDirectionBiasLocal] = useState<Record<Direction, number>>({
    N: 0.25,
    S: 0.25,
    E: 0.25,
    W: 0.25,
  });
  const [busRate, setBusRateLocal] = useState(0.08);
  const [metrics, setMetrics] = useState<MetricsSnapshot>(emptyMetrics);

  useEffect(() => {
    initSimulator('sandbox');
    return () => {
      destroySimulator();
    };
  }, [initSimulator, destroySimulator]);

  useEffect(() => {
    const saved = saveManager.getSandboxSetting<{
      spawnRate: number;
      directionBias: Record<Direction, number>;
      busRate: number;
      timeOfDay: TimeOfDay;
    }>('sandbox_config', {
      spawnRate: 1.2,
      directionBias: { N: 0.25, S: 0.25, E: 0.25, W: 0.25 },
      busRate: 0.08,
      timeOfDay: 'day',
    });
    setSpawnRateLocal(saved.spawnRate);
    setDirectionBiasLocal(saved.directionBias);
    setBusRateLocal(saved.busRate);
    setTimeOfDay(saved.timeOfDay);
    setSpawnRate(saved.spawnRate);
    setDirectionBias(saved.directionBias);
    setBusRate(saved.busRate);
  }, [setSpawnRate, setDirectionBias, setBusRate]);

  useEffect(() => {
    const PRIMARY_INTERSECTION = 'int_main';
    let rafId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = useGameStore.getState();
      if (status !== 'success' && status !== 'failed') {
        state.tick(delta);
      }
      state.tickPlayTime(delta);

      if (state.simulator) {
        setVehicles(state.simulator.getVehicles());
        const roadNetwork = state.simulator.getRoadNetwork();
        setLightState(roadNetwork.getTrafficLightState(PRIMARY_INTERSECTION));
        setMetrics(state.simulator.getMetrics());
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [status]);

  const handleBack = useCallback(() => {
    destroySimulator();
    navigate('/');
  }, [destroySimulator, navigate]);

  const handleTogglePause = useCallback(() => {
    if (status === 'simulating') {
      pauseSimulation();
    } else if (status === 'paused') {
      startSimulation();
    }
  }, [status, pauseSimulation, startSimulation]);

  const handleToggleTimeOfDay = useCallback(() => {
    const next = timeOfDay === 'day' ? 'night' : 'day';
    setTimeOfDay(next);
    saveManager.setSandboxSetting('sandbox_config', {
      spawnRate,
      directionBias,
      busRate,
      timeOfDay: next,
    });
  }, [timeOfDay, spawnRate, directionBias, busRate]);

  const updateSpawnRate = useCallback(
    (v: number) => {
      setSpawnRateLocal(v);
      setSpawnRate(v);
      saveManager.setSandboxSetting('sandbox_config', {
        spawnRate: v,
        directionBias,
        busRate,
        timeOfDay,
      });
    },
    [setSpawnRate, directionBias, busRate, timeOfDay]
  );

  const updateDirectionBias = useCallback(
    (dir: Direction, v: number) => {
      const newBias = { ...directionBias, [dir]: v };
      const total = newBias.N + newBias.S + newBias.E + newBias.W;
      if (total > 0) {
        setDirectionBiasLocal(newBias);
        setDirectionBias(newBias);
        saveManager.setSandboxSetting('sandbox_config', {
          spawnRate,
          directionBias: newBias,
          busRate,
          timeOfDay,
        });
      }
    },
    [directionBias, setDirectionBias, spawnRate, busRate, timeOfDay]
  );

  const updateBusRate = useCallback(
    (v: number) => {
      setBusRateLocal(v);
      setBusRate(v);
      saveManager.setSandboxSetting('sandbox_config', {
        spawnRate,
        directionBias,
        busRate: v,
        timeOfDay,
      });
    },
    [setBusRate, spawnRate, directionBias, timeOfDay]
  );

  const applyPreset = useCallback(
    (key: string) => {
      const preset = PRESETS[key];
      if (!preset) return;
      setSpawnRateLocal(preset.spawnRate);
      setDirectionBiasLocal(preset.bias);
      setBusRateLocal(preset.busRate);
      setSpawnRate(preset.spawnRate);
      setDirectionBias(preset.bias);
      setBusRate(preset.busRate);
      setTaxiRate(preset.taxiRate);
      saveManager.setSandboxSetting('sandbox_config', {
        spawnRate: preset.spawnRate,
        directionBias: preset.bias,
        busRate: preset.busRate,
        timeOfDay,
      });
    },
    [setSpawnRate, setDirectionBias, setBusRate, setTaxiRate, timeOfDay]
  );

  const applyIntensityPreset = useCallback(
    (idx: number) => {
      const rate = INTENSITY_VALUES[idx];
      setSpawnRateLocal(rate);
      setSpawnRate(rate);
      saveManager.setSandboxSetting('sandbox_config', {
        spawnRate: rate,
        directionBias,
        busRate,
        timeOfDay,
      });
    },
    [setSpawnRate, directionBias, busRate, timeOfDay]
  );

  const totalCycle =
    phaseConfig.nsGreen +
    phaseConfig.ewGreen +
    phaseConfig.yellow * 2 +
    phaseConfig.allRed * 2;

  const isSimulating = status === 'simulating';
  const isPaused = status === 'paused';

  const displayMetrics = [
    {
      icon: Activity,
      label: '拥堵指数',
      value: metrics.congestionIndex.toFixed(0),
      unit: '',
      max: 100,
      color:
        metrics.congestionIndex < 40
          ? '#7bed9f'
          : metrics.congestionIndex < 65
            ? '#ffd93d'
            : '#ff6b6b',
      better: 'lower' as const,
    },
    {
      icon: Timer,
      label: '平均等待',
      value: metrics.avgWaitingTime.toFixed(1),
      unit: 's',
      max: 50,
      color:
        metrics.avgWaitingTime < 15
          ? '#7bed9f'
          : metrics.avgWaitingTime < 30
            ? '#ffd93d'
            : '#ff6b6b',
      better: 'lower' as const,
    },
    {
      icon: Gauge,
      label: '平均车速',
      value: metrics.avgSpeed.toFixed(1),
      unit: 'm/s',
      max: 10,
      color: '#4ecdc4',
      better: 'higher' as const,
    },
    {
      icon: Bus,
      label: '公交准点',
      value: metrics.busOnTimeRate.toFixed(0),
      unit: '%',
      max: 100,
      color: '#4ecdc4',
      better: 'higher' as const,
    },
    {
      icon: TrendingUp,
      label: '通过车辆',
      value: metrics.throughput.toString(),
      unit: '辆',
      max: 500,
      color: '#a78bfa',
      better: 'higher' as const,
    },
    {
      icon: Car,
      label: '当前车辆',
      value: metrics.vehicleCount.toString(),
      unit: '辆',
      max: 100,
      color: '#fbbf24',
      better: 'neutral' as const,
    },
  ];

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const normalizeSlider = (val: number, min: number, max: number) =>
    ((val - min) / (max - min)) * 100;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <div className="absolute top-0 left-0 right-0 h-14 z-20 flex items-center justify-between px-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-cyan-500/20 hover:bg-slate-800/70 hover:border-cyan-400/40 text-slate-200 font-medium transition-all active:scale-95 shadow-lg shadow-cyan-500/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回</span>
          </button>

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse" />
            <div>
              <h2
                className="text-white font-bold text-base leading-tight"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                沙盒模式 / Sandbox
              </h2>
              <p className="text-slate-400 text-xs leading-tight">自由实验 · 无通关目标</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTimeOfDay}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl border transition-all active:scale-95 shadow-lg ${
              timeOfDay === 'night'
                ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200 shadow-indigo-500/10'
                : 'bg-slate-900/70 border-amber-500/30 hover:bg-amber-900/30 text-amber-200 shadow-amber-500/5'
            }`}
          >
            {timeOfDay === 'day' ? (
              <><Sun className="w-4 h-4" /><span className="text-sm font-medium">白天</span></>
            ) : (
              <><Moon className="w-4 h-4" /><span className="text-sm font-medium">夜晚</span></>
            )}
          </button>

          <button
            onClick={handleTogglePause}
            disabled={status !== 'simulating' && status !== 'paused'}
            className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-slate-600/40 hover:bg-slate-800/70 text-slate-200 transition-all active:scale-95 shadow-lg shadow-cyan-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <><Pause className="w-4 h-4" /><span className="text-sm font-medium">暂停</span></>
            ) : (
              <><Play className="w-4 h-4" /><span className="text-sm font-medium">继续</span></>
            )}
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-slate-600/40 hover:bg-amber-900/40 hover:border-amber-500/40 text-slate-200 transition-all active:scale-95 shadow-lg shadow-cyan-500/5"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">重置</span>
          </button>
        </div>
      </div>

      <div className="absolute inset-0">
        <SceneRoot
          vehicles={vehicles}
          lightState={lightState}
          timeOfDay={timeOfDay}
        />
      </div>

      <div className="absolute top-4 left-4 w-80 z-10 flex flex-col gap-3 pointer-events-auto max-h-[calc(100vh-180px)] overflow-y-auto pr-1 custom-scrollbar">
        <div className="backdrop-blur-xl bg-slate-900/75 rounded-2xl p-5 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-amber-300 font-bold tracking-wide text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  车流配置
                </h3>
                <p className="text-slate-400 text-xs">Traffic Config</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">车流强度</span>
                <span
                  className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-md bg-slate-800/60 text-amber-400"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {spawnRate.toFixed(1)}x
                </span>
              </div>
              <div className="relative h-2 bg-slate-700/70 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{
                    width: `${normalizeSlider(spawnRate, 0.3, 3.0)}%`,
                    background: '#f59e0b',
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                  }}
                />
                <input
                  type="range"
                  min={0.3}
                  max={3.0}
                  step={0.1}
                  value={spawnRate}
                  onChange={(e) => updateSpawnRate(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 pointer-events-none transition-all"
                  style={{
                    left: `calc(${normalizeSlider(spawnRate, 0.3, 3.0)}% - 8px)`,
                    borderColor: '#f59e0b',
                  }}
                />
              </div>
              <div className="flex gap-1 mt-2">
                {INTENSITY_LABELS.map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => applyIntensityPreset(idx)}
                    className={`flex-1 px-2 py-1 text-xs font-bold rounded transition-all ${
                      Math.abs(spawnRate - INTENSITY_VALUES[idx]) < 0.15
                        ? 'bg-amber-500 text-white shadow shadow-amber-500/50'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>方向偏置</span>
                <span className="text-slate-500">总和自动归一化</span>
              </div>
              {(['N', 'S', 'E', 'W'] as Direction[]).map((dir) => {
                const labels: Record<Direction, string> = { N: '北', S: '南', E: '东', W: '西' };
                const colors: Record<Direction, string> = {
                  N: '#7bed9f',
                  S: '#4ecdc4',
                  E: '#ff6b6b',
                  W: '#a78bfa',
                };
                const total = directionBias.N + directionBias.S + directionBias.E + directionBias.W || 1;
                const normalized = ((directionBias[dir] / total) * 100).toFixed(0);
                return (
                  <div key={dir}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: colors[dir] }}
                        >
                          {dir}
                        </div>
                        <span className="text-xs text-slate-400">{labels[dir]}方</span>
                      </div>
                      <span
                        className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded bg-slate-800/60"
                        style={{ color: colors[dir], fontFamily: 'Orbitron, sans-serif' }}
                      >
                        {normalized}%
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-slate-700/70 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all"
                        style={{
                          width: `${normalizeSlider(directionBias[dir], 0, 1)}%`,
                          background: colors[dir],
                          boxShadow: `0 0 8px ${colors[dir]}60`,
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={directionBias[dir]}
                        onChange={(e) => updateDirectionBias(dir, Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">公交比例</span>
                <span
                  className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-md bg-slate-800/60 text-teal-400"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {(busRate * 100).toFixed(0)}%
                </span>
              </div>
              <div className="relative h-2 bg-slate-700/70 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{
                    width: `${normalizeSlider(busRate, 0, 0.5)}%`,
                    background: '#4ecdc4',
                    boxShadow: '0 0 10px rgba(78, 205, 196, 0.5)',
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={busRate}
                  onChange={(e) => updateBusRate(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 pointer-events-none transition-all"
                  style={{
                    left: `calc(${normalizeSlider(busRate, 0, 0.5)}% - 8px)`,
                    borderColor: '#4ecdc4',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium mb-2">场景预设</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-800/60 border border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:border-amber-500/40 hover:text-amber-300 transition-all active:scale-95"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

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
                <p className="text-slate-400 text-xs">Timing Control</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-amber-500/30">
              <span className="text-amber-400 font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {totalCycle}s
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {([
              { key: 'nsGreen', label: '南北绿灯', min: 5, max: 60, color: '#7bed9f' },
              { key: 'ewGreen', label: '东西绿灯', min: 5, max: 60, color: '#7bed9f' },
            ] as const).map(({ key, label, min, max, color }) => (
              <TimingSlider
                key={key}
                label={label}
                value={phaseConfig[key]}
                min={min}
                max={max}
                color={color}
                onChange={(v) => setPhaseConfig({ [key]: v } as any)}
              />
            ))}
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

          <div className="mt-5 pt-4 border-t border-slate-700/50">
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
              disabled={status !== 'simulating' && status !== 'paused' && status !== 'playing'}
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

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-40rem)] max-w-3xl z-10 pointer-events-auto">
        <div
          className="absolute top-1 left-4 right-4 h-2 rounded-full overflow-hidden bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 -translate-y-full -mb-3"
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (timeElapsed / 999) * 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg px-2 rounded-full bg-slate-900/60">
              已运行 {formatTime(timeElapsed)} / ∞
            </span>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-slate-900/80 rounded-2xl p-4 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
          <div className="grid grid-cols-6 gap-3">
            {displayMetrics.map((m) => (
              <SandboxMetricCard key={m.label} {...m} />
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-amber-300 font-medium">
                  沙盒模式 · 不计入分数 · 无通关目标
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  自由调节所有参数，实验各种配时策略。配置会自动保存。
                </p>
              </div>
              <div className="flex-shrink-0 px-2 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <span className="text-[10px] font-bold text-amber-300">SANDBOX</span>
              </div>
            </div>
          </div>
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

interface MetricCardProps {
  icon: any;
  label: string;
  value: string;
  unit: string;
  color: string;
  max?: number;
  better: 'lower' | 'higher' | 'neutral';
}

function SandboxMetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  max = 100,
}: MetricCardProps) {
  const numValue = parseFloat(value);
  const percent = Math.min(100, (numValue / max) * 100);

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
    </div>
  );
}
