import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Music, Bug, Gauge } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

function VolumeSlider({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: typeof Volume2;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg"
        style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--accent-green)' }}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>
            {label}
          </span>
          <span
            className="font-display text-sm font-bold min-w-[3ch] text-right"
            style={{ color: 'var(--accent-green)' }}
          >
            {value}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
      </div>
      {value === 0 && (
        <VolumeX size={16} style={{ color: 'var(--accent-red)' }} />
      )}
    </div>
  );
}

function ToggleSwitch({
  label,
  icon: Icon,
  enabled,
  onToggle,
}: {
  label: string;
  icon: typeof Bug;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{
            background: enabled ? 'rgba(0, 255, 136, 0.1)' : 'rgba(139, 172, 184, 0.1)',
            color: enabled ? 'var(--accent-green)' : 'var(--text-secondary)',
          }}
        >
          <Icon size={20} />
        </div>
        <span className="font-body text-sm" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      </div>
      <button
        className="relative w-12 h-6 rounded-full transition-colors duration-200"
        style={{
          background: enabled ? 'var(--accent-green)' : 'var(--border-color)',
        }}
        onClick={onToggle}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
          style={{
            background: 'var(--text-primary)',
            transform: enabled ? 'translateX(26px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const {
    masterVolume,
    sfxVolume,
    bgmVolume,
    debugMode,
    showFps,
    setMasterVolume,
    setSfxVolume,
    setBgmVolume,
    setDebugMode,
    setShowFps,
  } = useSettingsStore();

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'linear-gradient(180deg, #0A2E36 0%, #0D3B46 100%)' }}
    >
      <header
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="font-display text-2xl tracking-wider"
          style={{ color: 'var(--accent-green)' }}
        >
          设置
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          <div className="card-base p-6 animate-fade-in-up">
            <h2
              className="font-body text-base font-bold mb-5 flex items-center gap-2"
              style={{ color: 'var(--accent-amber)' }}
            >
              <Volume2 size={18} />
              音量设置
            </h2>
            <div className="flex flex-col gap-5">
              <VolumeSlider
                label="主音量"
                icon={Volume2}
                value={masterVolume}
                onChange={setMasterVolume}
              />
              <VolumeSlider
                label="音效"
                icon={Volume2}
                value={sfxVolume}
                onChange={setSfxVolume}
              />
              <VolumeSlider
                label="背景音乐"
                icon={Music}
                value={bgmVolume}
                onChange={setBgmVolume}
              />
            </div>
          </div>

          <div
            className="card-base p-6 animate-fade-in-up"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            <h2
              className="font-body text-base font-bold mb-5 flex items-center gap-2"
              style={{ color: 'var(--accent-blue)' }}
            >
              <Bug size={18} />
              开发者选项
            </h2>
            <div className="flex flex-col gap-3">
              <ToggleSwitch
                label="调试模式"
                icon={Bug}
                enabled={debugMode}
                onToggle={() => setDebugMode(!debugMode)}
              />
              <ToggleSwitch
                label="显示帧率"
                icon={Gauge}
                enabled={showFps}
                onToggle={() => setShowFps(!showFps)}
              />
            </div>
          </div>

          <div
            className="card-base p-5 animate-fade-in-up"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
          >
            <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              设置会自动保存到本地存储
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
