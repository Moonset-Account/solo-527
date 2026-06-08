import { useSettingsStore } from '@/store/useSettingsStore';
import * as AudioTrigger from '@/engine/AudioTrigger';

export default function SettingsPanel() {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const bgmVolume = useSettingsStore((s) => s.bgmVolume);
  const quality = useSettingsStore((s) => s.quality);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);
  const setBgmVolume = useSettingsStore((s) => s.setBgmVolume);
  const setQuality = useSettingsStore((s) => s.setQuality);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  const handleResetSaves = () => {
    if (confirm('确定要清除所有存档吗？此操作不可恢复。')) {
      for (let i = 1; i <= 3; i++) {
        try { localStorage.removeItem(`traffic_sim_slot${i}`); } catch {}
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] p-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-8 font-['Orbitron'] text-2xl font-bold text-white/90">
          设置
        </h1>

        <div className="space-y-6">
          <section className="rounded-lg border border-white/10 bg-[#1a1a2e] p-5">
            <h2 className="mb-4 font-['Orbitron'] text-sm font-bold text-white/70">
              音频
            </h2>
            <div className="space-y-4">
              <VolumeSlider
                label="主音量"
                value={masterVolume}
                onChange={setMasterVolume}
              />
              <VolumeSlider
                label="音效"
                value={sfxVolume}
                onChange={setSfxVolume}
              />
              <VolumeSlider
                label="背景音乐"
                value={bgmVolume}
                onChange={setBgmVolume}
              />
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#1a1a2e] p-5">
            <h2 className="mb-4 font-['Orbitron'] text-sm font-bold text-white/70">
              画质
            </h2>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 rounded px-3 py-2 text-xs transition ${
                    quality === q
                      ? 'bg-[#0abde3]/20 text-[#0abde3]'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {q === 'low' ? '低' : q === 'medium' ? '中' : '高'}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#1a1a2e] p-5">
            <h2 className="mb-4 font-['Orbitron'] text-sm font-bold text-white/70">
              存档管理
            </h2>
            <button
              onClick={handleResetSaves}
              className="rounded bg-[#e74c3c]/10 px-4 py-2 text-xs text-[#e74c3c] transition hover:bg-[#e74c3c]/20"
            >
              清除所有存档
            </button>
          </section>

          <button
            onClick={resetSettings}
            className="w-full rounded bg-white/5 px-4 py-2 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            恢复默认设置
          </button>
        </div>
      </div>
    </div>
  );
}

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[10px] text-white/40">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded bg-white/10 accent-[#0abde3]"
      />
      <span className="w-10 text-right text-[10px] text-white/50">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
