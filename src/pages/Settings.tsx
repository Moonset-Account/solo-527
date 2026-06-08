import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX, Save, RotateCcw, Trash2 } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";

export default function Settings() {
  const navigate = useNavigate();
  const resetLevel = useGameStore((s) => s.resetLevel);
  const resetAll = useGameStore((s) => s.resetAll);
  const currentLevelId = useGameStore((s) => s.currentLevelId);

  const bgmVolume = useUIStore((s) => s.bgmVolume);
  const sfxVolume = useUIStore((s) => s.sfxVolume);
  const autoSave = useUIStore((s) => s.autoSave);
  const offlineEarnings = useUIStore((s) => s.offlineEarnings);
  const setBgmVolume = useUIStore((s) => s.setBgmVolume);
  const setSfxVolume = useUIStore((s) => s.setSfxVolume);
  const toggleAutoSave = useUIStore((s) => s.toggleAutoSave);
  const toggleOfflineEarnings = useUIStore((s) => s.toggleOfflineEarnings);

  const [confirmResetLevel, setConfirmResetLevel] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const handleResetLevel = () => {
    if (!confirmResetLevel) {
      setConfirmResetLevel(true);
      return;
    }
    resetLevel();
    setConfirmResetLevel(false);
  };

  const handleResetAll = () => {
    if (!confirmResetAll) {
      setConfirmResetAll(true);
      return;
    }
    resetAll();
    setConfirmResetAll(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-factory-dark flex flex-col">
      <div className="industrial-panel flex items-center justify-between px-4 py-2">
        <button className="rivet-btn px-3 py-1" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="inline mr-1" />
          返回
        </button>
        <h2 className="font-pixel text-xs text-factory-gold">设置</h2>
        <div />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <div className="industrial-panel p-4">
            <h3 className="font-pixel text-[10px] text-factory-cream mb-4">音频设置</h3>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-terminal text-factory-cream flex items-center gap-2">
                  <Volume2 size={16} /> 背景音乐
                </span>
                <span className="font-terminal text-factory-gold">{bgmVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={bgmVolume}
                onChange={(e) => setBgmVolume(Number(e.target.value))}
                className="w-full h-2 bg-factory-dark appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:bg-factory-gold [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-factory-border"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-terminal text-factory-cream flex items-center gap-2">
                  <VolumeX size={16} /> 音效
                </span>
                <span className="font-terminal text-factory-accent">{sfxVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sfxVolume}
                onChange={(e) => setSfxVolume(Number(e.target.value))}
                className="w-full h-2 bg-factory-dark appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:bg-factory-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-factory-border"
              />
            </div>
          </div>

          <div className="industrial-panel p-4">
            <h3 className="font-pixel text-[10px] text-factory-cream mb-4">游戏设置</h3>

            <div className="flex items-center justify-between mb-3">
              <span className="font-terminal text-factory-cream flex items-center gap-2">
                <Save size={16} /> 自动存档
              </span>
              <button
                className={`rivet-btn px-3 py-1 text-sm ${autoSave ? "border-factory-green text-factory-green" : ""}`}
                onClick={toggleAutoSave}
              >
                {autoSave ? "开" : "关"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-terminal text-factory-cream flex items-center gap-2">
                <Save size={16} /> 离线收益
              </span>
              <button
                className={`rivet-btn px-3 py-1 text-sm ${offlineEarnings ? "border-factory-green text-factory-green" : ""}`}
                onClick={toggleOfflineEarnings}
              >
                {offlineEarnings ? "开" : "关"}
              </button>
            </div>
          </div>

          <div className="industrial-panel p-4">
            <h3 className="font-pixel text-[10px] text-factory-red mb-4">危险区域</h3>

            <div className="flex flex-col gap-3">
              <div>
                <button
                  className={`rivet-btn px-4 py-2 w-full ${confirmResetLevel ? "border-factory-red text-factory-red" : ""}`}
                  onClick={handleResetLevel}
                >
                  <RotateCcw size={16} className="inline mr-2" />
                  {confirmResetLevel ? "确认重置当前关卡?" : "重置当前关卡"}
                </button>
                {confirmResetLevel && (
                  <button
                    className="rivet-btn px-3 py-1 text-sm mt-1"
                    onClick={() => setConfirmResetLevel(false)}
                  >
                    取消
                  </button>
                )}
              </div>

              <div>
                <button
                  className={`rivet-btn px-4 py-2 w-full ${confirmResetAll ? "border-factory-red text-factory-red" : ""}`}
                  onClick={handleResetAll}
                >
                  <Trash2 size={16} className="inline mr-2" />
                  {confirmResetAll ? "确认删除所有存档?" : "重置所有存档"}
                </button>
                {confirmResetAll && (
                  <button
                    className="rivet-btn px-3 py-1 text-sm mt-1"
                    onClick={() => setConfirmResetAll(false)}
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
