import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Star, Coins } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { LEVEL_CONFIGS } from "@/config/levels";

export default function LevelSelect() {
  const navigate = useNavigate();
  const coins = useGameStore((s) => s.coins);
  const exp = useGameStore((s) => s.exp);
  const completedLevels = useGameStore((s) => s.completedLevels);

  return (
    <div className="min-h-screen bg-factory-dark flex flex-col">
      <div className="industrial-panel flex items-center justify-between px-4 py-2">
        <button className="rivet-btn px-3 py-1" onClick={() => navigate("/")}>
          <ArrowLeft size={16} className="inline mr-1" />
          返回
        </button>
        <h2 className="font-pixel text-xs text-factory-gold">选择关卡</h2>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-terminal text-factory-gold">
            <Coins size={14} /> {coins}
          </span>
          <span className="flex items-center gap-1 font-terminal text-factory-green">
            <Star size={14} /> {exp}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {LEVEL_CONFIGS.map((level, index) => {
            const progress = completedLevels[level.id];
            const unlocked = progress?.unlocked ?? false;
            const stars = progress?.stars ?? 0;

            return (
              <button
                key={level.id}
                className={`industrial-panel p-4 text-left transition-all cursor-pointer relative
                  ${unlocked
                    ? "hover:border-factory-accent hover:shadow-[0_0_12px_rgba(196,93,44,0.3)]"
                    : "opacity-50 cursor-not-allowed"
                  }`}
                onClick={() => unlocked && navigate(`/factory/${level.id}`)}
                disabled={!unlocked}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-pixel text-[10px] text-factory-cream">
                    {level.name}
                  </span>
                  {!unlocked && <Lock size={16} className="text-factory-cream/40" />}
                </div>

                <div className="font-terminal text-factory-cream/60 text-sm mb-2">
                  {level.gridWidth}×{level.gridHeight} 网格 · ⬡{level.startCoins} 起始
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      size={18}
                      className={s <= stars ? "text-factory-gold fill-factory-gold" : "text-factory-border"}
                    />
                  ))}
                </div>

                {unlocked && (
                  <div className="font-terminal text-factory-cream/50 text-xs mb-2">
                    {level.description}
                  </div>
                )}

                {unlocked && (
                  <div className="font-terminal text-factory-accent text-sm">
                    进入关卡 →
                  </div>
                )}

                <div className="absolute bottom-2 right-3 w-2 h-2 rounded-full"
                     style={{ background: "radial-gradient(circle, #8B7355 40%, #6B5B3A 60%)" }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
