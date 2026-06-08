import { useNavigate } from "react-router-dom";
import { Star, ArrowRight, RotateCcw, Home } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { soundManager } from "@/game/sound";
import type { LevelCompleteInfo } from "@/game/types";

export default function LevelCompleteModal({ info }: { info: LevelCompleteInfo }) {
  const navigate = useNavigate();
  const resetLevel = useGameStore((s) => s.resetLevel);
  const dismissLevelComplete = useGameStore((s) => s.dismissLevelComplete);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleRetry = () => {
    soundManager.play("click");
    dismissLevelComplete();
    resetLevel();
  };

  const handleNext = () => {
    soundManager.play("click");
    dismissLevelComplete();
    navigate("/level-select");
  };

  const handleHome = () => {
    soundManager.play("click");
    dismissLevelComplete();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        className="industrial-panel w-96 p-0"
        style={{ animation: "stampIn 0.4s ease-out" }}
      >
        <div className="px-6 py-4 border-b-2 border-factory-border bg-factory-dark/50 text-center">
          <h3 className="font-pixel text-sm text-factory-gold mb-2">关卡完成!</h3>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                size={32}
                className={`transition-all duration-300 ${
                  s <= info.stars
                    ? "text-factory-gold fill-factory-gold scale-110"
                    : "text-factory-border scale-90"
                }`}
                style={{ animationDelay: `${s * 0.2}s` }}
              />
            ))}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-factory-dark/50 border border-factory-border">
              <div className="font-terminal text-xs text-factory-cream/60">用时</div>
              <div className="font-terminal text-xl text-factory-cream">{formatTime(info.timeTaken)}</div>
            </div>
            <div className="text-center p-3 bg-factory-dark/50 border border-factory-border">
              <div className="font-terminal text-xs text-factory-cream/60">完成订单</div>
              <div className="font-terminal text-xl text-factory-green">{info.ordersCompleted}</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-2">
            <div className="text-center">
              <div className="font-terminal text-xs text-factory-cream/60">金币奖励</div>
              <div className="font-terminal text-2xl text-factory-gold">⬡{info.coinReward}</div>
            </div>
            <div className="w-px h-10 bg-factory-border" />
            <div className="text-center">
              <div className="font-terminal text-xs text-factory-cream/60">经验奖励</div>
              <div className="font-terminal text-2xl text-factory-green">★{info.expReward}</div>
            </div>
          </div>

          {info.stars < 3 && (
            <div className="text-center font-terminal text-sm text-factory-cream/50 bg-factory-dark/30 p-2 border border-factory-border">
              💡 提示: 优化生产线布局和升级策略可获得更多星星
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              className="rivet-btn-gold px-4 py-2 text-lg w-full"
              onClick={handleNext}
            >
              <ArrowRight size={18} className="inline mr-2" />
              选择下一关
            </button>
            <button
              className="rivet-btn-primary px-4 py-2 w-full"
              onClick={handleRetry}
            >
              <RotateCcw size={16} className="inline mr-2" />
              重新挑战
            </button>
            <button
              className="rivet-btn px-4 py-2 w-full"
              onClick={handleHome}
            >
              <Home size={16} className="inline mr-2" />
              返回主菜单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
