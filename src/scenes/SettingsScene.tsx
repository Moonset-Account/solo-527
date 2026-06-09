import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Monitor,
  Gamepad2,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Sun,
  Moon,
  Play,
} from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import useUIStore from '@/store/useUIStore';
import AudioTrigger from '@/core/AudioTrigger';
import SaveSystem from '@/core/SaveSystem';
import type { GameSettings } from '@/game/types';

interface SceneProps {
  onEnter?: () => void;
  onExit?: () => void;
}

const audio = AudioTrigger.getInstance();
const saveSystem = SaveSystem.getInstance();

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      onClick={() => {
        audio.playSwitchToggle();
        onChange(!checked);
      }}
      className={`
        relative inline-flex h-7 w-14 items-center rounded-full
        border-2 transition-all
        ${checked
          ? 'bg-circuit-current/20 border-circuit-current'
          : 'bg-circuit-board border-circuit-border'
        }
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full transition-all
          ${checked
            ? 'translate-x-8 bg-circuit-current shadow-neon'
            : 'translate-x-1 bg-gray-500'
          }
        `}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-circuit-border/50 last:border-b-0">
      <div className="flex-1">
        <div className="text-sm text-white">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        )}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<any>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-circuit-current/30">
      <Icon size={22} className="text-circuit-current" />
      <h3 className="font-pixel text-lg text-circuit-current">{title}</h3>
    </div>
  );
}

export default function SettingsScene({ onEnter, onExit }: SceneProps) {
  const { saveData, updateSettings, resetTutorial, resetAll, setSaveData, loadSave, setScene } =
    useGameStore();
  const { pushNotification, openModal, closeModal } = useUIStore();
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const ambientNodeRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const { settings } = saveData;

  useEffect(() => {
    loadSave();
    onEnter?.();
    return () => {
      stopAmbient();
      onExit?.();
    };
  }, []);

  const handleChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    updateSettings({ [key]: value } as Partial<GameSettings>);
  };

  const handleVolumeChange = (vol: number) => {
    audio.setVolume(vol);
    handleChange('volume', vol);
  };

  const handleSoundEnabled = (enabled: boolean) => {
    audio.setEnabled(enabled);
    handleChange('audioEnabled', enabled);
    handleChange('soundEnabled', enabled);
  };

  const playTestSounds = () => {
    audio.ensureContext();
    audio.playClick();
    setTimeout(() => audio.playSuccess(), 200);
  };

  const startAmbient = () => {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const sampleRate = ctx.sampleRate;
      const duration = 2;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.02;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      const gain = ctx.createGain();
      gain.gain.value = 0.1;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      ambientNodeRef.current = { source, gain };
      setAmbientPlaying(true);
    } catch (_) {}
  };

  const stopAmbient = () => {
    if (ambientNodeRef.current) {
      try {
        ambientNodeRef.current.source.stop();
        ambientNodeRef.current.source.disconnect();
        ambientNodeRef.current.gain.disconnect();
      } catch (_) {}
      ambientNodeRef.current = null;
    }
    setAmbientPlaying(false);
  };

  const toggleAmbient = () => {
    audio.playClick();
    if (ambientPlaying) stopAmbient();
    else startAmbient();
  };

  const handleExport = () => {
    audio.playClick();
    try {
      saveSystem.downloadSaveFile(saveData);
      pushNotification({
        type: 'success',
        title: '✅ 存档已导出',
        message: '存档文件已下载',
      });
    } catch (err) {
      pushNotification({
        type: 'error',
        title: '❌ 导出失败',
        message: (err as Error).message,
      });
    }
  };

  const handleImport = async () => {
    audio.playClick();
    try {
      const imported = await saveSystem.triggerFileImport();
      setSaveData(imported);
      audio.setVolume(imported.settings.volume);
      pushNotification({
        type: 'success',
        title: '✅ 导入成功',
        message: '存档已加载',
      });
    } catch (err) {
      audio.playError();
      pushNotification({
        type: 'error',
        title: '❌ 导入失败',
        message: (err as Error).message,
      });
    }
  };

  const handleResetTutorial = () => {
    audio.playClick();
    openModal({
      title: '🔄 重置教程进度',
      content: (
        <div className="font-mono text-sm text-gray-300 space-y-2">
          <p>将清除所有教程完成状态。</p>
          <p className="text-yellow-400">下次进入教程关卡时将重新播放教程。</p>
        </div>
      ),
      confirmText: '确认重置',
      onConfirm: () => {
        resetTutorial();
        closeModal('');
        pushNotification({
          type: 'success',
          title: '✅ 教程已重置',
        });
      },
      onCancel: () => closeModal(''),
    });
  };

  const handleClearAll = () => {
    audio.playClick();
    openModal({
      title: '⚠️ 清空所有存档',
      type: 'danger',
      content: (
        <div className="font-mono text-sm space-y-3">
          <p className="text-circuit-error font-bold">此操作将永久删除所有数据！</p>
          <ul className="text-gray-300 space-y-1 list-disc list-inside">
            <li>所有关卡进度和星星</li>
            <li>游戏统计数据</li>
            <li>保存的电路方案</li>
            <li>所有设置</li>
          </ul>
          <p className="text-yellow-400">此操作无法撤销！</p>
        </div>
      ),
      confirmText: '确认清空',
      onConfirm: () => {
        audio.playError();
        resetAll();
        closeModal('');
        pushNotification({
          type: 'success',
          title: '✅ 存档已清空',
        });
      },
      onCancel: () => closeModal(''),
    });
  };

  const handleBack = () => {
    audio.playClick();
    setScene('menu');
  };

  return (
    <div className="min-h-screen bg-circuit-bg text-white font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,212,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <style>{`
        .screw-border {
          position: relative;
          border: 2px solid #2d3a5c;
          box-shadow:
            0 0 0 2px #1a1a2e,
            0 0 0 4px #2d3a5c,
            inset 0 0 30px rgba(0,212,255,0.05);
        }
        .screw-border::before,
        .screw-border::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background: #445;
          border-radius: 50%;
          box-shadow: inset 0 0 4px #000;
        }
        .screw-border::before { top: -7px; left: -7px; }
        .screw-border::after { bottom: -7px; right: -7px; }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-track {
          height: 6px;
          background: #2d3a5c;
          border-radius: 3px;
          border: 1px solid #3d4a6c;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: #00d4ff;
          border-radius: 50%;
          border: 2px solid #00a8cc;
          margin-top: -7px;
          box-shadow: 0 0 10px rgba(0,212,255,0.6);
        }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col p-4 md:p-8">
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-3 rounded border-2 border-circuit-border
              hover:border-circuit-current bg-circuit-board/60 hover:bg-circuit-board
              transition-all active:translate-y-[2px] active:shadow-inset-panel"
          >
            <ArrowLeft size={20} className="text-circuit-current" />
            <span className="font-pixel text-sm">返回</span>
          </button>
          <h1
            className="font-pixel text-2xl md:text-3xl text-circuit-current flex-1 text-center"
            style={{
              textShadow:
                '0 0 10px rgba(0,212,255,0.6), 0 0 20px rgba(0,212,255,0.3)',
            }}
          >
            设置
          </h1>
          <div className="w-[110px]" />
        </header>

        <main className="flex-1 max-w-3xl mx-auto w-full space-y-6 pb-8">
          <section className="screw-border bg-circuit-panel rounded-lg p-5">
            <SectionTitle icon={Volume2} title="音频设置" />
            <SettingRow
              label="音效开关"
              description="启用/禁用所有游戏音效"
              control={
                <Toggle
                  checked={settings.soundEnabled}
                  onChange={handleSoundEnabled}
                />
              }
            />
            <SettingRow
              label="音量"
              description={`当前音量: ${Math.round((settings.volume || 0.7) * 100)}%`}
              control={
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume ?? 0.7}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-40"
                />
              }
            />
            <SettingRow
              label="试听音效"
              description="播放点击+成功音效测试"
              control={
                <button
                  onClick={playTestSounds}
                  className="flex items-center gap-2 px-4 py-2 rounded border-2 border-circuit-current/50
                    bg-circuit-board hover:bg-circuit-current/10 text-circuit-current
                    transition-all active:translate-y-[2px] font-pixel text-xs"
                >
                  <Play size={16} /> 试听
                </button>
              }
            />
            <SettingRow
              label="环境音"
              description={ambientPlaying ? '正在播放白噪声' : '播放白噪声占位'}
              control={
                <div className="flex items-center gap-2">
                  {ambientPlaying ? (
                    <Volume2 size={18} className="text-circuit-bulb animate-pulse" />
                  ) : (
                    <VolumeX size={18} className="text-gray-500" />
                  )}
                  <button
                    onClick={toggleAmbient}
                    className={`px-3 py-1.5 rounded border-2 font-pixel text-xs transition-all active:translate-y-[2px] ${
                      ambientPlaying
                        ? 'border-circuit-bulb bg-circuit-bulb/20 text-circuit-bulb'
                        : 'border-circuit-border bg-circuit-board text-gray-400 hover:border-circuit-border hover:text-white'
                    }`}
                  >
                    {ambientPlaying ? '停止' : '播放'}
                  </button>
                </div>
              }
            />
          </section>

          <section className="screw-border bg-circuit-panel rounded-lg p-5">
            <SectionTitle icon={Monitor} title="显示设置" />
            <SettingRow
              label="网格显示"
              description="显示/隐藏画布背景网格"
              control={
                <Toggle
                  checked={settings.gridVisible}
                  onChange={(v) => handleChange('gridVisible', v)}
                />
              }
            />
            <SettingRow
              label="动画效果"
              description="启用/禁用UI动画和过渡"
              control={
                <Toggle
                  checked={settings.animationsEnabled}
                  onChange={(v) => handleChange('animationsEnabled', v)}
                />
              }
            />
            <SettingRow
              label="主题"
              control={
                <div className="flex gap-2">
                  {[
                    { key: 'dark', label: '深色', icon: Moon },
                    { key: 'light', label: '浅色', icon: Sun },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = settings.theme === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => {
                          audio.playClick();
                          handleChange('theme', t.key as 'dark' | 'light');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded border-2 font-pixel text-xs transition-all active:translate-y-[2px] ${
                          active
                            ? 'border-circuit-current bg-circuit-current/20 text-circuit-current'
                            : 'border-circuit-border bg-circuit-board text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon size={14} /> {t.label}
                      </button>
                    );
                  })}
                </div>
              }
            />
            <SettingRow
              label="画质"
              description="控制粒子数量等视觉效果"
              control={
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((q) => {
                    const labels = { low: '低', medium: '中', high: '高' };
                    const active = (settings as any).quality === q;
                    return (
                      <button
                        key={q}
                        onClick={() => {
                          audio.playClick();
                          updateSettings({ ...settings, quality: q } as any);
                        }}
                        className={`px-3 py-2 rounded border-2 font-pixel text-xs transition-all active:translate-y-[2px] ${
                          active
                            ? 'border-circuit-current bg-circuit-current/20 text-circuit-current'
                            : 'border-circuit-border bg-circuit-board text-gray-400 hover:text-white'
                        }`}
                      >
                        {labels[q]}
                      </button>
                    );
                  })}
                </div>
              }
            />
          </section>

          <section className="screw-border bg-circuit-panel rounded-lg p-5">
            <SectionTitle icon={Gamepad2} title="游戏设置" />
            <SettingRow
              label="教程提示"
              description="进入关卡时显示教程指引"
              control={
                <Toggle
                  checked={settings.showTutorial}
                  onChange={(v) => handleChange('showTutorial', v)}
                />
              }
            />
            <SettingRow
              label="自动保存"
              description="游戏过程中自动存档"
              control={
                <Toggle
                  checked={settings.autoSave}
                  onChange={(v) => handleChange('autoSave', v)}
                />
              }
            />
            <SettingRow
              label="难度偏好"
              description="关卡显示筛选（暂仅影响显示）"
              control={
                <div className="flex gap-2">
                  {(['easy', 'normal', 'hard'] as const).map((d) => {
                    const labels = { easy: '简单', normal: '普通', hard: '困难' };
                    const active = settings.difficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          audio.playClick();
                          handleChange('difficulty', d);
                        }}
                        className={`px-3 py-2 rounded border-2 font-pixel text-xs transition-all active:translate-y-[2px] ${
                          active
                            ? 'border-circuit-current bg-circuit-current/20 text-circuit-current'
                            : 'border-circuit-border bg-circuit-board text-gray-400 hover:text-white'
                        }`}
                      >
                        {labels[d]}
                      </button>
                    );
                  })}
                </div>
              }
            />
          </section>

          <section className="screw-border bg-circuit-panel rounded-lg p-5">
            <SectionTitle icon={HardDrive} title="数据管理" />
            <SettingRow
              label="导出存档"
              description="下载JSON格式的存档文件"
              control={
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded border-2 border-circuit-current/50
                    bg-circuit-board hover:bg-circuit-current/10 text-circuit-current
                    transition-all active:translate-y-[2px] font-pixel text-xs"
                >
                  <Download size={16} /> 导出
                </button>
              }
            />
            <SettingRow
              label="导入存档"
              description="从JSON文件导入并覆盖现有存档"
              control={
                <button
                  onClick={handleImport}
                  className="flex items-center gap-2 px-4 py-2 rounded border-2 border-circuit-bulb/50
                    bg-circuit-board hover:bg-circuit-bulb/10 text-circuit-bulb
                    transition-all active:translate-y-[2px] font-pixel text-xs"
                >
                  <Upload size={16} /> 导入
                </button>
              }
            />
            <SettingRow
              label="重置教程进度"
              description="清除教程完成状态"
              control={
                <button
                  onClick={handleResetTutorial}
                  className="flex items-center gap-2 px-4 py-2 rounded border-2 border-circuit-border
                    bg-circuit-board hover:bg-circuit-panel text-gray-300
                    transition-all active:translate-y-[2px] font-pixel text-xs"
                >
                  <RotateCcw size={16} /> 重置
                </button>
              }
            />
            <SettingRow
              label="清空所有存档"
              description="⚠️ 永久删除所有进度数据"
              control={
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 rounded border-2 border-circuit-error/60
                    bg-circuit-board hover:bg-circuit-error/10 text-circuit-error
                    transition-all active:translate-y-[2px] font-pixel text-xs"
                >
                  <AlertTriangle size={16} /> 清空
                </button>
              }
            />
          </section>
        </main>
      </div>
    </div>
  );
}
