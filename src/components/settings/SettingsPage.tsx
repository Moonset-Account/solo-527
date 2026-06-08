import { ArrowLeft, Volume2, VolumeX, Monitor, Gamepad2, Keyboard, Smartphone, Database, Download, Upload, Trash2, Save, RotateCcw, Sparkles, Eye, EyeOff, Palette, MousePointer2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { GameButton, cn } from '../ui/GameButton';
import { Slider } from '../ui/Slider';
import { GlassCard } from '../ui/GlassCard';
import { KeyHint } from '../ui/KeyHint';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useSaveStore } from '../../store/useSaveStore';
import { useGameNavStore } from '../../store/useGameNavStore';
import type { InputDevice, InputAction } from '../../types/config';
import { validateAllConfigs } from '../../utils/config';

const DEVICES: { id: InputDevice; name: string; icon: typeof Keyboard }[] = [
  { id: 'keyboard', name: '键盘', icon: Keyboard },
  { id: 'mouse', name: '鼠标', icon: MousePointer2 },
  { id: 'gamepad', name: '游戏手柄', icon: Gamepad2 },
  { id: 'touch', name: '触摸手势', icon: Smartphone },
];

export function SettingsPage() {
  const { settings, setGraphics, setAudio, setInputDevice, rebind, resetInputBindings, togglePerfStats, toggleHints } = useSettingsStore();
  const save = useSaveStore(s => s.save);
  const { saveNow, clearAll, exportData, importData } = useSaveStore();
  const navigate = useGameNavStore(s => s.navigate);
  const [tab, setTab] = useState<'audio' | 'graphics' | 'input' | 'data'>('audio');
  const [rebinding, setRebinding] = useState<{ action: InputAction } | null>(null);
  const [rebindDevice, setRebindDevice] = useState<InputDevice>(settings.currentInputDevice);
  const importRef = useRef<HTMLInputElement>(null);
  const configStatus = validateAllConfigs();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef(0);
  const prevGamepadBtns = useRef<Set<string>>(new Set());
  const gamepadRafRef = useRef<number | null>(null);

  const actionLabels: Record<InputAction, string> = {
    select: '选择/确认', cancel: '取消/返回', drag: '拖拽',
    heat_up: '升温加热', cool_down: '降温/撤热', stir: '搅拌',
    pour: '倒取试剂', menu: '打开菜单', pause: '暂停', help: '帮助',
  };

  const confirmRebind = (device: InputDevice, keyName: string) => {
    if (!rebinding) return;
    rebind(rebinding.action, device, keyName);
    setRebinding(null);
    if (gamepadRafRef.current) cancelAnimationFrame(gamepadRafRef.current);
    gamepadRafRef.current = null;
  };

  useEffect(() => {
    if (!rebinding) {
      if (gamepadRafRef.current) cancelAnimationFrame(gamepadRafRef.current);
      gamepadRafRef.current = null;
      return;
    }

    const device = rebindDevice;
    const btnMap: Record<number, string> = {
      0: 'A', 1: 'B', 2: 'X', 3: 'Y',
      4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
      8: 'Back', 9: 'Start', 10: 'Select', 11: 'Options',
      12: 'DpadUp', 13: 'DpadDown', 14: 'DpadLeft', 15: 'DpadRight',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      confirmRebind('keyboard', e.code || e.key);
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      const btn = e.button === 0 ? 'LMB' : e.button === 1 ? 'MMB' : 'RMB';
      confirmRebind('mouse', btn);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      confirmRebind('mouse', e.deltaY < 0 ? 'ScrollUp' : 'ScrollDown');
    };
    const onDbl = (e: MouseEvent) => {
      e.preventDefault();
      confirmRebind('mouse', 'LMB+dbl');
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      touchStartRef.current = { x: t.clientX - rect.left, y: t.clientY - rect.top, time: performance.now() };
      const now = performance.now();
      if (now - lastTapRef.current < 320) {
        confirmRebind('touch', 'DoubleTap');
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
      if (e.touches.length === 2) confirmRebind('touch', 'TwoFinger');
      if (e.touches.length === 3) confirmRebind('touch', 'TripleTap');
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const t = e.touches[0];
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
      const dx = pos.x - touchStartRef.current.x;
      const dy = pos.y - touchStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 60) {
        if (Math.abs(dy) > Math.abs(dx) * 1.8) {
          confirmRebind('touch', dy < 0 ? 'SwipeUp' : 'SwipeDown');
        } else if (Math.abs(dx) > Math.abs(dy) * 1.8) {
          confirmRebind('touch', dx > 0 ? 'SwipeRight' : 'SwipeLeft');
        } else {
          confirmRebind('touch', 'SwipeDrag');
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dur = performance.now() - touchStartRef.current.time;
      const t = e.changedTouches[0];
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
      const dx = pos.x - touchStartRef.current.x;
      const dy = pos.y - touchStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dur > 600 && dist < 20) confirmRebind('touch', 'LongPress');
      else if (dist < 12 && dur < 320) confirmRebind('touch', 'Tap');
      touchStartRef.current = null;
    };

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads.find(g => g && g.connected);
      if (gp) {
        const current = new Set<string>();
        gp.buttons.forEach((b, i) => {
          if (b.pressed || b.value > 0.5) {
            const name = btnMap[i];
            if (name) current.add(name);
          }
        });
        current.forEach(name => {
          if (!prevGamepadBtns.current.has(name)) {
            confirmRebind('gamepad', name);
          }
        });
        prevGamepadBtns.current = current;
      }
      if (rebinding) gamepadRafRef.current = requestAnimationFrame(pollGamepad);
    };

    const onContext = (e: Event) => e.preventDefault();

    if (device === 'keyboard') {
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('contextmenu', onContext);
    } else if (device === 'mouse') {
      window.addEventListener('mousedown', onMouseDown, true);
      window.addEventListener('wheel', onWheel, { capture: true, passive: false } as AddEventListenerOptions);
      window.addEventListener('dblclick', onDbl, true);
      window.addEventListener('contextmenu', onContext);
    } else if (device === 'touch') {
      const el = document.body;
      el.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
      el.addEventListener('touchend', onTouchEnd, { capture: true });
    } else if (device === 'gamepad') {
      prevGamepadBtns.current.clear();
      gamepadRafRef.current = requestAnimationFrame(pollGamepad);
    }

    const timeout = setTimeout(() => {
      setRebinding(null);
    }, 10000);

    return () => {
      clearTimeout(timeout);
      if (gamepadRafRef.current) cancelAnimationFrame(gamepadRafRef.current);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('contextmenu', onContext);
      window.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('dblclick', onDbl, true);
      const el = document.body;
      el.removeEventListener('touchstart', onTouchStart, true);
      el.removeEventListener('touchmove', onTouchMove, true);
      el.removeEventListener('touchend', onTouchEnd, true);
    };
  }, [rebinding, rebindDevice]);

  const beginRebindForDevice = (action: InputAction, device: InputDevice) => {
    setRebindDevice(device);
    setRebinding({ action });
  };

  const handleImport = async (file: File) => {
    const ok = await importData(file);
    if (ok) saveNow();
  };

  return (
    <div className="min-h-screen w-full bg-[#0a1628] text-slate-100">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <GameButton variant="ghost" size="md" icon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => { saveNow(); navigate('menu'); }}>返回</GameButton>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">设置</h1>
            <p className="text-sm text-slate-400 mt-0.5">调整游戏参数以获得最佳体验</p>
          </div>
          <GameButton variant="secondary" icon={<Save className="w-4 h-4" />} onClick={saveNow}>保存</GameButton>
        </div>
        <div className="max-w-4xl mx-auto px-6 pb-4 flex gap-2">
          {([
            { id: 'audio' as const, name: '音频', icon: Volume2 },
            { id: 'graphics' as const, name: '画质', icon: Monitor },
            { id: 'input' as const, name: '操作', icon: Gamepad2 },
            { id: 'data' as const, name: '数据', icon: Database },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                tab === t.id
                  ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
              )}
            >
              <t.icon className="w-4 h-4" />{t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {!configStatus.ok && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            <div className="font-semibold flex items-center gap-2 mb-1">
              <Trash2 className="w-4 h-4" />配置校验错误
            </div>
            <div className="opacity-90 text-xs space-y-0.5">
              {Object.entries(configStatus.levels).map(([lid, errs]) =>
                errs.map((e, i) => <div key={`${lid}-${i}`}>· [{lid}] {e}</div>),
              )}
            </div>
          </div>
        )}

        {tab === 'audio' && (
          <GlassCard title={<span className="flex items-center gap-2"><Volume2 className="w-5 h-5 text-cyan-300" />音频设置</span>}
            icon={<Volume2 className="w-5 h-5" />}>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center gap-3">
                  {settings.audio.muted ? (
                    <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300"><VolumeX className="w-5 h-5" /></div>
                  ) : (
                    <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300"><Volume2 className="w-5 h-5" /></div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-100">全局静音</div>
                    <div className="text-xs text-slate-400">一键关闭所有游戏声音</div>
                  </div>
                </div>
                <button
                  onClick={() => setAudio({ muted: !settings.audio.muted })}
                  className={cn(
                    'w-14 h-8 rounded-full transition-all relative',
                    settings.audio.muted ? 'bg-slate-700' : 'bg-cyan-500 shadow-lg shadow-cyan-500/30',
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all',
                    settings.audio.muted ? 'left-1' : 'left-7',
                  )} />
                </button>
              </div>
              <Slider label="主音量" value={Math.round(settings.audio.masterVolume * 100)}
                onChange={v => setAudio({ masterVolume: v / 100 })} suffix="%" />
              <Slider label="音效音量" value={Math.round(settings.audio.sfxVolume * 100)}
                onChange={v => setAudio({ sfxVolume: v / 100 })} suffix="%" accent="emerald" />
              <Slider label="背景音乐音量" value={Math.round(settings.audio.bgmVolume * 100)}
                onChange={v => setAudio({ bgmVolume: v / 100 })} suffix="%" accent="amber" />
            </div>
          </GlassCard>
        )}

        {tab === 'graphics' && (
          <GlassCard title={<span className="flex items-center gap-2"><Monitor className="w-5 h-5 text-cyan-300" />画质与显示</span>}
            icon={<Palette className="w-5 h-5" />}>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: 'particlesEnabled', label: '粒子效果', desc: '气泡、火花、烟雾等粒子',
                    getter: settings.graphics.particlesEnabled, setter: (v: boolean) => setGraphics({ particlesEnabled: v }),
                  },
                  {
                    key: 'postProcessing', label: '后处理效果', desc: '泛光、渐变等增强效果',
                    getter: settings.graphics.postProcessing, setter: (v: boolean) => setGraphics({ postProcessing: v }),
                  },
                  {
                    key: 'showPerfStats', label: '性能面板', desc: '显示FPS、帧时间等信息',
                    getter: settings.showPerfStats, setter: (v: boolean) => togglePerfStats(),
                  },
                  {
                    key: 'showHints', label: '操作提示', desc: '在关卡中显示操作建议',
                    getter: settings.showHints, setter: (v: boolean) => toggleHints(),
                  },
                ].map(item => (
                  <div key={item.key} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-slate-100 text-sm">{item.label}</div>
                      <button
                        onClick={() => item.setter(!item.getter)}
                        className={cn(
                          'w-11 h-6 rounded-full transition-all relative shrink-0',
                          item.getter ? 'bg-cyan-500 shadow shadow-cyan-500/30' : 'bg-slate-700',
                        )}
                      >
                        <span className={cn(
                          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all',
                          item.getter ? 'left-5' : 'left-0.5',
                        )} />
                      </button>
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
              <Slider label="目标帧率" value={settings.graphics.targetFPS}
                onChange={v => setGraphics({ targetFPS: Math.round(v) })}
                min={30} max={144} step={1} suffix=" FPS" />
              <div>
                <div className="text-sm text-slate-300 font-medium mb-2">液体渲染精度</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setGraphics({ fluidPrecision: p })}
                      className={cn(
                        'py-2.5 rounded-xl text-sm font-medium transition-all',
                        settings.graphics.fluidPrecision === p
                          ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 shadow shadow-cyan-500/10'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60',
                      )}
                    >
                      {p === 'low' ? '性能优先' : p === 'medium' ? '平衡' : '最高质量'}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="泛光强度" value={Math.round(settings.graphics.bloomIntensity * 100)}
                onChange={v => setGraphics({ bloomIntensity: v / 100 })} suffix="%" accent="amber" />
            </div>
          </GlassCard>
        )}

        {tab === 'input' && (
          <div className="space-y-5">
            <GlassCard title={<span className="flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-cyan-300" />输入设备</span>}
              icon={<Gamepad2 className="w-5 h-5" />}>
              <div className="grid grid-cols-4 gap-2">
                {DEVICES.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setInputDevice(d.id)}
                    className={cn(
                      'p-4 rounded-xl transition-all flex flex-col items-center gap-2',
                      settings.currentInputDevice === d.id
                        ? 'bg-cyan-500/20 border-2 border-cyan-400/60 text-cyan-200 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                    )}
                  >
                    <d.icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{d.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                💡 游戏会自动检测您的操作方式并切换按键提示，您也可以在此手动选择偏好的输入方式。
              </p>
            </GlassCard>

            <GlassCard
              title={<span className="flex items-center gap-2">
                {(DEVICES.find(d => d.id === settings.currentInputDevice)?.icon || Keyboard) && (() => {
                  const DevIcon = DEVICES.find(d => d.id === settings.currentInputDevice)?.icon || Keyboard;
                  return <DevIcon className="w-5 h-5 text-cyan-300" />;
                })()}
                按键绑定 · {DEVICES.find(d => d.id === settings.currentInputDevice)?.name}
              </span>}
              icon={(() => {
                const DevIcon = DEVICES.find(d => d.id === settings.currentInputDevice)?.icon || Keyboard;
                return <DevIcon className="w-5 h-5" />;
              })()}>
              <div className="mb-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 text-xs text-slate-300">
                {settings.currentInputDevice === 'keyboard' && '💡 点击「重绑」后按下任意键盘按键完成绑定。支持功能键。'}
                {settings.currentInputDevice === 'mouse' && '💡 点击「重绑」后执行鼠标操作（点击/滚轮/双击）完成绑定。'}
                {settings.currentInputDevice === 'gamepad' && '💡 请先连接手柄并按下任意按键激活，然后点击「重绑」按下目标按钮。'}
                {settings.currentInputDevice === 'touch' && '💡 建议在触摸设备上操作。点击「重绑」后执行目标手势（点击/长按/滑动等）。'}
              </div>
              <div className="space-y-2">
                {(['select', 'cancel', 'heat_up', 'cool_down', 'stir', 'pour', 'pause', 'help'] as InputAction[]).map(action => (
                  <div key={action}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/50 transition-all">
                    <div>
                      <div className="font-medium text-sm text-slate-100">{actionLabels[action]}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <KeyHint action={action} device={settings.currentInputDevice} bindings={settings.inputs[settings.currentInputDevice].bindings}
                        label="" />
                      <button
                        onClick={() => beginRebindForDevice(action, settings.currentInputDevice)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          rebinding?.action === action && rebindDevice === settings.currentInputDevice
                            ? 'bg-cyan-500/30 border border-cyan-400/60 text-cyan-100 animate-pulse'
                            : 'bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-600/60',
                        )}
                      >
                        {rebinding?.action === action && rebindDevice === settings.currentInputDevice ? (() => {
                          const prompts: Record<InputDevice, string> = {
                            keyboard: '按下按键...',
                            mouse: '点击/滚轮...',
                            gamepad: '按下手柄键...',
                            touch: '执行手势...',
                          };
                          return prompts[settings.currentInputDevice];
                        })() : '重绑'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <GameButton variant="ghost" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={resetInputBindings}>
                  恢复默认
                </GameButton>
              </div>
            </GlassCard>
          </div>
        )}

        {tab === 'data' && (
          <div className="space-y-5">
            <GlassCard title={<span className="flex items-center gap-2"><Database className="w-5 h-5 text-cyan-300" />数据管理</span>}
              icon={<Database className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-3xl font-black text-cyan-300 tabular-nums">{save ? save.statistics.totalExperiments : '0'}</div>
                  <div className="text-xs text-slate-400 mt-1">实验总次数</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-3xl font-black text-amber-300 tabular-nums">{(save.statistics.learnTime / 60).toFixed(0)}</div>
                  <div className="text-xs text-slate-400 mt-1">学习分钟</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-3xl font-black text-emerald-300 tabular-nums">
                    {(save.statistics.accuracyRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">操作准确率</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <GameButton variant="secondary" size="lg" className="w-full justify-start"
                  icon={<Download className="w-5 h-5" />} onClick={exportData}>
                  <div className="text-left">
                    <div className="font-semibold">导出存档</div>
                    <div className="text-xs text-slate-400 font-normal">保存为文件以便备份</div>
                  </div>
                </GameButton>
                <input ref={importRef} type="file" accept=".txt,.json" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
                <GameButton variant="secondary" size="lg" className="w-full justify-start"
                  icon={<Upload className="w-5 h-5" />} onClick={() => importRef.current?.click()}>
                  <div className="text-left">
                    <div className="font-semibold">导入存档</div>
                    <div className="text-xs text-slate-400 font-normal">从备份文件恢复</div>
                  </div>
                </GameButton>
                <GameButton variant="danger" size="lg" className="w-full justify-start"
                  icon={<Trash2 className="w-5 h-5" />}
                  onClick={() => {
                    if (window.confirm('确定要清除所有游戏数据吗？此操作不可撤销！')) {
                      clearAll();
                    }
                  }}>
                  <div className="text-left">
                    <div className="font-semibold">清除数据</div>
                    <div className="text-xs text-slate-400 font-normal">重置所有进度和设置</div>
                  </div>
                </GameButton>
              </div>
            </GlassCard>

            <GlassCard title={<span className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-300" />关于</span>}
              icon={<Eye className="w-5 h-5" />}>
              <div className="text-sm text-slate-300 space-y-2 leading-relaxed">
                <p>
                  <strong className="text-cyan-300">化学实验室教学游戏</strong>
                  &nbsp;是一款沉浸式化学实验模拟游戏。所有实验均在虚拟环境中进行，
                  零风险、零耗材。
                </p>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-200 text-xs">
                  <EyeOff className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>重要声明：</strong>本游戏仅用于教学目的。现实中的化学实验需要在专业老师指导下，
                    在配备齐全的安全防护设施中进行。请勿模仿游戏中的操作。
                  </span>
                </div>
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50 flex justify-between">
                  <span>版本 1.0.0 · Build 20250609</span>
                  <span>配置状态：{configStatus.ok ? '✅ 正常' : '⚠️ 存在问题'}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
