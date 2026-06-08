import { useEffect, useRef, useState, useCallback } from 'react';
import { GameLoop } from '../../game/GameLoop';
import { Renderer } from '../../game/Renderer';
import { ExperimentEngine } from '../../game/GameState';
import { InputManager } from '../../game/InputManager';
import { AudioSystem } from '../../game/audio/AudioSystem';
import { getReagentById, getEquipmentById } from '../../utils/config';
import { useSettingsStore } from '../../store/useSettingsStore';
import { PerfPanel } from '../ui/PerfPanel';
import { KeyHint } from '../ui/KeyHint';
import { cn, GameButton } from '../ui/GameButton';
import type { LevelResult } from '../../types/save';
import type { InputAction } from '../../types/config';
import {
  Play, Pause, RotateCcw, Home, Flame, Snowflake, CircleDot, HelpCircle, AlertTriangle, ShieldAlert,
  Sparkles, Droplets, ThermometerSun, Clock, X, ChevronRight, BookOpen, Star, Trophy, Target,
} from 'lucide-react';
import { clamp, formatTime, withAlpha } from '../../utils/math';

interface GameCanvasProps {
  levelId: string;
  onComplete: (result: LevelResult) => void;
  onExit: () => void;
}

const REAGENT_VOLUMES: number[] = [5, 10, 20, 50];

export function GameCanvas({ levelId, onComplete, onExit }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const engineRef = useRef<ExperimentEngine | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const audioRef = useRef<AudioSystem | null>(null);
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate(n => n + 1), []);
  const [showHelp, setShowHelp] = useState(false);
  const [pourVolume, setPourVolume] = useState(10);
  const settings = useSettingsStore(s => s.settings);
  const [showKnowledge, setShowKnowledge] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current!;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      canvas.width = w;
      canvas.height = h;
      rendererRef.current?.resize(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    audioRef.current = new AudioSystem(settings.audio);
    const engine = new ExperimentEngine(audioRef.current);
    engineRef.current = engine;
    const loadOk = engine.loadLevel(levelId);
    if (!loadOk) { onExit(); return; }

    const renderer = new Renderer(settings.graphics);
    renderer.resize(canvas.width, canvas.height);
    rendererRef.current = renderer;

    const input = new InputManager(settings);
    inputRef.current = input;
    input.attach(canvas);

    const loop = new GameLoop(settings.graphics.targetFPS);
    gameLoopRef.current = loop;
    loop.attach(canvas);

    const reagentColorMap: Record<string, { color: string; glow?: string }> = {};
    (engine.state.levelConfig?.availableReagents || []).forEach(rid => {
      const r = getReagentById(rid);
      if (r) reagentColorMap[rid] = { color: r.color, glow: r.glowColor };
    });

    let handleMouseMove: ((e: MouseEvent) => void) | null = null;
    let handleMouseUp: ((e: MouseEvent) => void) | null = null;
    let activePourReagent: string | null = null;

    const getCanvasPos = (e: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const findEquipmentAt = (x: number, y: number) => {
      return engine.state.equipment.find(eq => {
        const conf = getEquipmentById(eq.equipmentId);
        if (!conf) return false;
        const w = conf.renderParams.width + 20;
        const h = conf.renderParams.height + 20;
        return Math.abs(x - eq.x) < w / 2 && Math.abs(y - eq.y) < h / 2;
      });
    };

    const doPour = (reagentId: string, eq: ReturnType<typeof engine.getEquipment>) => {
      if (!eq) return;
      const res = engine.pourReagent(reagentId, eq.id, pourVolume);
      if (res.ok) {
        audioRef.current?.playSfx('pour', 0.6);
        if (res.knowledge) {
          engine.triggerKnowledgeCard(res.knowledge);
          setShowKnowledge(true);
        }
      } else if (res.message) {
        engine.showToast(res.safety ? 'safety' : 'warning', res.safety ? '安全警告' : '操作提示', res.message, 2500);
        if (res.safety) engine.state.safetyViolations += 0;
      }
      rerender();
    };

    canvas.addEventListener('mousedown', (e) => {
      const pos = getCanvasPos(e);
      if (e.button === 0) {
        const eq = findEquipmentAt(pos.x, pos.y);
        if (eq) {
          const oldSelected = engine.state.selectedEquipmentId;
          engine.selectEquipment(oldSelected === eq.id ? null : eq.id);
          audioRef.current?.playSfx(oldSelected === eq.id ? 'drop' : 'pickup', 0.4);
          rerender();
        } else if (activePourReagent) {
          const eq2 = findEquipmentAt(pos.x, pos.y);
          doPour(activePourReagent, eq2);
          activePourReagent = null;
          engine.state.draggingReagent = null;
        }
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const pos = getCanvasPos(e);
      if (activePourReagent) {
        engine.state.draggingReagent = {
          reagentId: activePourReagent,
          volume: pourVolume,
          x: pos.x, y: pos.y,
        };
      }
    });

    input.on('heat_up', () => {
      const eqId = engine.state.selectedEquipmentId;
      if (!eqId) return;
      const eq = engine.getEquipment(eqId);
      const newLevel = clamp((eq?.heatLevel || 0) + 0.2, 0.2, 1);
      engine.startHeating(eqId, newLevel);
      rerender();
    });
    input.on('cool_down', () => {
      const eqId = engine.state.selectedEquipmentId;
      if (!eqId) return;
      const eq = engine.getEquipment(eqId);
      if ((eq?.heatLevel || 0) > 0.25) {
        engine.startHeating(eqId, clamp((eq?.heatLevel || 0) - 0.25, 0.2, 1));
      } else {
        engine.stopHeating(eqId);
      }
      rerender();
    });
    input.on('stir', () => {
      const eqId = engine.state.selectedEquipmentId;
      if (!eqId) return;
      const eq = engine.getEquipment(eqId);
      if (eq?.isStirring) engine.stopStirring(eqId);
      else engine.startStirring(eqId, 1);
      audioRef.current?.playSfx(eq?.isStirring ? 'drop' : 'stir', 0.3);
      rerender();
    });
    input.on('pause', () => {
      if (engine.state.state === 'running') { engine.pause(); rerender(); }
      else if (engine.state.state === 'paused') { engine.resume(); rerender(); }
    });
    input.on('help', () => setShowHelp(h => !h));
    input.onDeviceChange(() => rerender());

    loop.onUpdate((dt) => {
      engine.update(dt);
      if (engine.state.state === 'completed' || engine.state.state === 'failed') {
        loop.stop();
        setTimeout(() => {
          const result = engine.getResult();
          if (result) onComplete(result);
        }, 1500);
      }
      if (engine.state.knowledgePopup?.visible && !showKnowledge) {
        setShowKnowledge(true);
      }
    });
    loop.onRender((ctx) => {
      renderer.render(ctx, engine.state.equipment, engine.particles.particles,
        engine.state.draggingReagent, reagentColorMap);
    });

    engine.start();
    loop.start();
    audioRef.current?.startBgm();

    let uiTimer = setInterval(rerender, 100);

    return () => {
      clearInterval(uiTimer);
      ro.disconnect();
      audioRef.current?.stopBgm();
      input.detach();
      loop.stop();
      loop.detach();
      if (handleMouseMove) canvas.removeEventListener('mousemove', handleMouseMove);
      if (handleMouseUp) window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.updateSettings(settings.audio);
    if (rendererRef.current) rendererRef.current.setSettings(settings.graphics);
    if (gameLoopRef.current) gameLoopRef.current.setTargetFPS(settings.graphics.targetFPS);
  }, [settings]);

  const engine = engineRef.current;
  const state = engine?.state;
  const level = state?.levelConfig;
  const currentStep = engine?.getCurrentStep();
  const stepProgress = state?.stepsProgress;
  const currentDevice = inputRef.current?.getCurrentDevice() || settings.currentInputDevice;
  const bindings = inputRef.current?.getAllBindings(currentDevice) || settings.inputs[currentDevice].bindings;

  const selectReagentForPour = (reagentId: string) => {
    if (!engine) return;
    const selectedId = engine.state.selectedEquipmentId;
    if (selectedId) {
      const eq = engine.getEquipment(selectedId);
      const conf = eq ? getEquipmentById(eq.equipmentId) : null;
      if (eq && conf && (conf.type === 'beaker' || conf.type === 'flask')) {
        const res = engine.pourReagent(reagentId, eq.id, pourVolume);
        if (res.knowledge) {
          engine.triggerKnowledgeCard(res.knowledge);
          setShowKnowledge(true);
        }
        rerender();
        return;
      }
    }
    engine.showToast('info', '选择目标', '请先点击选择一个容器，再加入试剂', 2200);
    rerender();
  };

  const toggleHeat = () => {
    const eqId = engine?.state.selectedEquipmentId;
    if (!eqId || !engine) return;
    const eq = engine.getEquipment(eqId);
    if (eq?.isHeating) { engine.stopHeating(eqId); }
    else {
      const below = state!.equipment.find(
        e => getEquipmentById(e.equipmentId)?.type === 'burner' &&
          Math.abs(e.x - eq.x) < 80 && Math.abs(e.y - eq.y) < 150,
      );
      if (below) { engine.startHeating(below.id, 0.7); }
      else { engine.startHeating(eqId, 0.7); }
    }
    rerender();
  };

  const toggleStir = () => {
    const eqId = engine?.state.selectedEquipmentId;
    if (!eqId || !engine) return;
    const eq = engine.getEquipment(eqId);
    if (eq?.isStirring) engine.stopStirring(eqId);
    else engine.startStirring(eqId, 1);
    rerender();
  };

  const togglePause = () => {
    if (!engine) return;
    if (engine.state.state === 'running') engine.pause();
    else if (engine.state.state === 'paused') engine.resume();
    rerender();
  };

  const retryLevel = () => {
    if (!engine || !gameLoopRef.current) return;
    engine.loadLevel(levelId);
    engine.start();
    gameLoopRef.current.resume();
    rerender();
  };

  if (!state || !level) {
    return (
      <div className="h-full flex items-center justify-center text-cyan-300 text-xl">
        加载关卡中...
      </div>
    );
  }

  const timeLeft = clamp((level.timeLimit || 0) - state.elapsedTime, 0, level.timeLimit || 0);
  const timePct = level.timeLimit ? timeLeft / level.timeLimit : 1;
  const scorePct = state.score / level.maxScore;

  return (
    <div className="h-full w-full flex flex-col bg-[#0a1628] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-5">
          <GameButton variant="ghost" size="sm" icon={<Home className="w-4 h-4" />} onClick={onExit}>
            退出
          </GameButton>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-100">{level.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className={cn('w-4 h-4', timePct < 0.25 && 'text-rose-400 animate-pulse')} />
            <span className={cn(
              'font-mono text-lg tabular-nums font-semibold',
              timePct < 0.25 ? 'text-rose-400' : timePct < 0.5 ? 'text-amber-300' : 'text-cyan-200',
            )}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-lg tabular-nums text-amber-300 font-semibold">
              {state.score.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">/ {level.maxScore}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <Star
                key={i}
                className={cn(
                  'w-5 h-5 transition-all duration-500',
                  scorePct >= level.starThresholds[i] / level.maxScore
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                    : 'text-slate-600 fill-slate-800',
                )}
              />
            ))}
          </div>
          <GameButton variant="ghost" size="sm" icon={<HelpCircle className="w-4 h-4" />} onClick={() => setShowHelp(h => !h)}>帮助</GameButton>
          <GameButton variant="ghost" size="sm" onClick={togglePause}
            icon={state.state === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}>
            {state.state === 'paused' ? '继续' : '暂停'}
          </GameButton>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 shrink-0 bg-slate-900/50 border-r border-slate-700/50 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <Droplets className="w-4 h-4" />试剂架
          </h3>
          <div className="space-y-2">
            {level.availableReagents.map(rid => {
              const r = getReagentById(rid);
              if (!r) return null;
              const hazardColor =
                r.hazardLevel === 'danger' ? 'text-rose-400 border-rose-500/40' :
                r.hazardLevel === 'warning' ? 'text-orange-400 border-orange-500/40' :
                r.hazardLevel === 'caution' ? 'text-amber-400 border-amber-500/40' :
                'text-emerald-400 border-emerald-500/30';
              return (
                <button
                  key={rid}
                  onClick={() => selectReagentForPour(rid)}
                  className="w-full p-3 rounded-xl border bg-slate-800/60 hover:bg-slate-700/70 border-slate-600/40
                    transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-12 rounded-b-lg rounded-t-md border-2 border-slate-500/60 flex items-end justify-center overflow-hidden relative"
                      style={{
                        background: `linear-gradient(to top, ${withAlpha(r.color, 0.7)} 0%, ${withAlpha(r.color, 0.2)} 70%, transparent 100%)`,
                        boxShadow: r.glowColor ? `inset 0 -4px 12px ${withAlpha(r.glowColor, 0.3)}` : 'none',
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1.5 border-b border-slate-400/50 bg-slate-700/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-100 text-sm truncate">{r.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{r.formula}</div>
                      <div className={cn('text-[10px] mt-0.5 px-1.5 py-0.5 rounded inline-block border', hazardColor)}>
                        {r.hazardLevel === 'safe' ? '安全' : r.hazardLevel === 'caution' ? '注意' : r.hazardLevel === 'warning' ? '警告' : '危险'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <h4 className="text-xs text-slate-400 font-semibold mb-2 flex items-center justify-between">
              <span>加入量</span>
              <span className="text-cyan-300 font-mono">{pourVolume} mL</span>
            </h4>
            <div className="grid grid-cols-4 gap-1">
              {REAGENT_VOLUMES.map(v => (
                <button
                  key={v}
                  onClick={() => setPourVolume(v)}
                  className={cn(
                    'py-1.5 text-xs rounded-lg font-mono transition-all',
                    pourVolume === v
                      ? 'bg-cyan-500/30 border border-cyan-400/60 text-cyan-200'
                      : 'bg-slate-700/40 border border-slate-600/50 text-slate-300 hover:bg-slate-600/60',
                  )}
                >{v}</button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs text-slate-400 font-semibold mb-2">安全统计</h4>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">操作失误</span>
                <span className={cn('font-mono', state.errors > 0 ? 'text-amber-300' : 'text-emerald-300')}>{state.errors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">安全违规</span>
                <span className={cn('font-mono', state.safetyViolations > 0 ? 'text-rose-400' : 'text-emerald-300')}>{state.safetyViolations} / 5</span>
              </div>
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 relative">
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
          <PerfPanel
            enabled={settings.showPerfStats}
            getStats={() => gameLoopRef.current?.getPerfStats() || { fps: 0, frameTime: 0, minFps: 0, maxFps: 0, avgFps: 0, drawCalls: 0, particles: 0, memory: 0 }}
          />

          {state.state === 'paused' && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="text-center">
                <Pause className="w-20 h-20 text-cyan-300 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-slate-100 mb-6">已暂停</h2>
                <div className="flex flex-col gap-3 items-center">
                  <GameButton size="lg" icon={<Play className="w-5 h-5" />} onClick={togglePause}>继续实验</GameButton>
                  <GameButton variant="secondary" size="lg" icon={<RotateCcw className="w-5 h-5" />} onClick={retryLevel}>重新开始</GameButton>
                  <GameButton variant="ghost" size="lg" icon={<Home className="w-5 h-5" />} onClick={onExit}>返回菜单</GameButton>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 right-4 pointer-events-none z-10">
            {state.toasts.slice(-4).map(t => {
              const age = (performance.now() - t.startTime) / t.duration;
              const opacity = age < 0.1 ? age / 0.1 : age > 0.85 ? (1 - age) / 0.15 : 1;
              const borderColor =
                t.type === 'success' ? 'border-emerald-400/60 bg-emerald-500/15' :
                t.type === 'warning' ? 'border-amber-400/60 bg-amber-500/15' :
                t.type === 'error' ? 'border-rose-400/60 bg-rose-500/15' :
                t.type === 'safety' ? 'border-rose-500/70 bg-rose-600/20' :
                'border-cyan-400/60 bg-cyan-500/15';
              const iconEl =
                t.type === 'success' ? <Sparkles className="w-4 h-4 text-emerald-300" /> :
                t.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-300" /> :
                t.type === 'error' ? <X className="w-4 h-4 text-rose-300" /> :
                t.type === 'safety' ? <ShieldAlert className="w-4 h-4 text-rose-300 animate-pulse" /> :
                <Target className="w-4 h-4 text-cyan-300" />;
              return (
                <div
                  key={t.id}
                  style={{ opacity }}
                  className={cn(
                    'mb-2 max-w-md mx-auto rounded-xl px-4 py-2.5 backdrop-blur-md border',
                    borderColor,
                    'flex items-start gap-3 shadow-xl',
                  )}
                >
                  <div className="mt-0.5">{iconEl}</div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'text-sm font-semibold',
                      t.type === 'success' ? 'text-emerald-200' :
                      t.type === 'warning' ? 'text-amber-200' :
                      t.type === 'error' ? 'text-rose-200' :
                      t.type === 'safety' ? 'text-rose-100' :
                      'text-cyan-200',
                    )}>{t.title}</div>
                    <div className="text-xs text-slate-200/80 mt-0.5 leading-relaxed">{t.message}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {showKnowledge && state.knowledgePopup && (
            <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none z-20 px-4">
              <div className="max-w-lg w-full pointer-events-auto rounded-2xl border-2 border-cyan-400/50 bg-slate-900/95 backdrop-blur-xl p-5 shadow-2xl shadow-cyan-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-cyan-400 font-semibold tracking-wide uppercase">知识卡片</div>
                      <h3 className="text-lg font-bold text-slate-100">{state.knowledgePopup.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowKnowledge(false); engine.dismissKnowledge(); }}
                    className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-200/90 leading-relaxed">{state.knowledgePopup.content}</p>
                <div className="mt-4 flex justify-end">
                  <GameButton size="sm" onClick={() => { setShowKnowledge(false); engine.dismissKnowledge(); }} iconRight={<ChevronRight className="w-4 h-4" />}>
                    继续实验
                  </GameButton>
                </div>
              </div>
            </div>
          )}

          {showHelp && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-30 p-6">
              <div className="max-w-2xl w-full rounded-2xl bg-slate-800/90 border border-slate-600/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold text-slate-100">操作说明</h2>
                  <button onClick={() => setShowHelp(false)}
                    className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-300 mb-2">基本操作</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />点击容器选中</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />点击试剂加入已选容器</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />拖拽试剂到任意容器</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />调整加入量以控制精度</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-300 mb-2">快捷键 ({inputRef.current?.getDeviceName(currentDevice)})</h4>
                    <div className="space-y-1.5 text-sm">
                      {(['heat_up', 'cool_down', 'stir', 'pause', 'help'] as InputAction[]).map(a => (
                        <KeyHint key={a} action={a} device={currentDevice} bindings={bindings} />
                      ))}
                    </div>
                  </div>
                  {level.safetyNotes.length > 0 && (
                    <div className="md:col-span-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
                      <h4 className="text-sm font-semibold text-rose-300 mb-2 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />本关安全提示
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-xs text-rose-200/90">
                        {level.safetyNotes.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <GameButton size="lg" onClick={() => setShowHelp(false)} iconRight={<ChevronRight className="w-5 h-5" />}>开始实验</GameButton>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-72 shrink-0 bg-slate-900/50 border-l border-slate-700/50 flex flex-col">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />实验目标
            </h3>
            <p className="text-sm text-slate-200/90 leading-relaxed">{level.objective}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <ThermometerSun className="w-4 h-4" />实验步骤
            </h3>
            <div className="space-y-2">
              {level.steps.map((step, i) => {
                const sp = stepProgress[i];
                const isCurrent = sp?.status === 'current';
                const isDone = sp?.status === 'completed';
                const isFailed = sp?.status === 'failed';
                return (
                  <div key={step.id}
                    className={cn(
                      'relative rounded-xl p-3 border transition-all',
                      isCurrent ? 'border-cyan-400/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' :
                      isDone ? 'border-emerald-500/40 bg-emerald-500/5' :
                      isFailed ? 'border-rose-500/50 bg-rose-500/10' :
                      'border-slate-700/50 bg-slate-800/30',
                    )}>
                    <div className="flex items-start gap-2.5">
                      <div className={cn(
                        'w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold',
                        isCurrent ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white animate-pulse' :
                        isDone ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50' :
                        isFailed ? 'bg-rose-500/30 text-rose-300 border border-rose-400/50' :
                        'bg-slate-700/60 text-slate-400',
                      )}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'font-semibold text-sm leading-tight',
                          isCurrent ? 'text-cyan-100' : isDone ? 'text-emerald-200' : 'text-slate-200',
                        )}>{step.title}</div>
                        <div className={cn(
                          'text-xs mt-1 leading-relaxed',
                          isCurrent ? 'text-cyan-200/80' : 'text-slate-400',
                        )}>{step.description}</div>
                        {isDone && (
                          <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                            <span className="text-emerald-400 font-mono">+{sp.score}分</span>
                            {sp.errors > 0 && <span className="text-amber-400">失误 {sp.errors}次</span>}
                          </div>
                        )}
                        {isCurrent && currentStep?.id === step.id && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {(['heat_up', 'cool_down', 'stir'] as InputAction[]).some(a =>
                              (step.type === 'heat' && (a === 'heat_up' || a === 'cool_down')) ||
                              (step.type === 'stir' && a === 'stir')
                            ) && (
                              <div className="flex flex-wrap gap-1.5">
                                {step.type === 'heat' && (
                                  <>
                                    <KeyHint action="heat_up" device={currentDevice} bindings={bindings} />
                                    <KeyHint action="cool_down" device={currentDevice} bindings={bindings} />
                                  </>
                                )}
                                {step.type === 'stir' && <KeyHint action="stir" device={currentDevice} bindings={bindings} />}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-700/50">
            <h3 className="text-xs text-slate-400 font-semibold mb-3">快捷操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <GameButton
                size="sm"
                variant={state.selectedEquipmentId && state.equipment.find(e => e.id === state.selectedEquipmentId)?.isHeating
                  ? 'warning'
                  : state.selectedEquipmentId ? 'secondary' : 'secondary'}
                icon={<Flame className="w-4 h-4" />}
                onClick={toggleHeat}
                disabled={!state.selectedEquipmentId}
              >
                加热
              </GameButton>
              <GameButton
                size="sm"
                variant="secondary"
                icon={<Snowflake className="w-4 h-4" />}
                onClick={() => {
                  const id = state.selectedEquipmentId;
                  if (id) engine.stopHeating(id);
                }}
                disabled={!state.selectedEquipmentId}
              >
                撤热
              </GameButton>
              <GameButton
                size="sm"
                variant={state.selectedEquipmentId && state.equipment.find(e => e.id === state.selectedEquipmentId)?.isStirring
                  ? 'primary' : 'secondary'}
                icon={<CircleDot className="w-4 h-4" />}
                onClick={toggleStir}
                disabled={!state.selectedEquipmentId}
              >
                搅拌
              </GameButton>
              <GameButton
                size="sm"
                variant="danger"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={retryLevel}
              >
                重试
              </GameButton>
            </div>
            {currentStep?.hints && settings.showHints && (
              <div className="mt-3 p-2.5 rounded-lg border border-amber-400/30 bg-amber-500/5 text-[11px] text-amber-200/90 leading-relaxed">
                <div className="font-semibold text-amber-300 mb-1">💡 提示</div>
                {currentStep.hints.map((h, i) => <div key={i}>· {h}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
