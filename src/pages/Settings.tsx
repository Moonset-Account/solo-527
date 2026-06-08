import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSaveStore } from '@/stores/saveStore';
import { InputMode } from '@/types/game';
import { inputManager } from '@/engine/input/manager';
import { ArrowLeft, Keyboard, Mouse, Smartphone, Volume2, VolumeX, RotateCcw } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, setInputMode, setMusicVolume, setSfxVolume } = useSettingsStore();
  const resetSave = useSaveStore(s => s.resetSave);

  const inputModes: { mode: InputMode; icon: typeof Keyboard; label: string; desc: string }[] = [
    { mode: 'keyboard', icon: Keyboard, label: '键盘', desc: '数字键选择 · 方向键控温 · Space确认' },
    { mode: 'mouse', icon: Mouse, label: '鼠标', desc: '点击选择 · 拖拽操作 · 滑块控温' },
    { mode: 'touch', icon: Smartphone, label: '触摸', desc: '点选操作 · 手势控温 · 点按确认' },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#0a2e2e] via-[#0D4F4F] to-[#0a2e2e] py-8 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-400 hover:text-[#F5C542] transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <h1 className="text-2xl font-bold text-[#F5C542] mb-8">设置</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-white font-bold text-sm mb-4">输入方式</h2>
            <div className="grid grid-cols-3 gap-3">
              {inputModes.map(({ mode, icon: Icon, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => { setInputMode(mode); inputManager.setMode(mode); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    settings.inputMode === mode
                      ? 'border-[#F5C542] bg-[#F5C542]/10 shadow-[0_0_15px_rgba(245,197,66,0.2)]'
                      : 'border-[#1a5a5a] bg-[#0a2e2e]/50 hover:border-[#2a6a6a]'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${settings.inputMode === mode ? 'text-[#F5C542]' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${settings.inputMode === mode ? 'text-[#F5C542]' : 'text-gray-300'}`}>{label}</span>
                  <span className="text-[10px] text-gray-500 text-center leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-sm mb-4">音量</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {settings.musicVolume > 0 ? <Volume2 className="w-5 h-5 text-gray-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
                <span className="text-gray-300 text-sm w-16">音乐</span>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={settings.musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-[#1a3a3a] rounded-lg appearance-none cursor-pointer accent-[#F5C542]"
                />
                <span className="text-gray-400 text-xs w-8">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                {settings.sfxVolume > 0 ? <Volume2 className="w-5 h-5 text-gray-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
                <span className="text-gray-300 text-sm w-16">音效</span>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={settings.sfxVolume}
                  onChange={(e) => setSfxVolume(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-[#1a3a3a] rounded-lg appearance-none cursor-pointer accent-[#F5C542]"
                />
                <span className="text-gray-400 text-xs w-8">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-sm mb-4">按键提示参考</h2>
            <div className="bg-[#0a2e2e]/80 rounded-xl border border-[#1a5a5a] p-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['select', 'add', 'temperature', 'confirm', 'hint', 'pause', 'cancel'].map(action => (
                  <div key={action} className="flex justify-between p-1.5">
                    <span className="text-gray-400">{action === 'select' ? '选择器材' : action === 'add' ? '添加试剂' : action === 'temperature' ? '控制温度' : action === 'confirm' ? '确认步骤' : action === 'hint' ? '提示' : action === 'pause' ? '暂停' : '取消/关闭'}</span>
                    <span className="text-[#F5C542] font-mono">{inputManager.getKeyHint(action)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-sm mb-4">存档管理</h2>
            <button
              onClick={() => { if (confirm('确定要重置所有存档吗？此操作不可撤销。')) resetSave(); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" /> 重置存档
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
