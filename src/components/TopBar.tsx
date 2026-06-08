import { useNavigate } from "react-router-dom";
import { Play, Pause, FastForward, Home, Settings } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { LEVEL_CONFIGS } from "@/config/levels";

export default function TopBar() {
  const navigate = useNavigate();
  const coins = useGameStore((s) => s.coins);
  const exp = useGameStore((s) => s.exp);
  const currentLevelId = useGameStore((s) => s.currentLevelId);
  const isPaused = useGameStore((s) => s.isPaused);
  const speed = useGameStore((s) => s.speed);
  const togglePause = useGameStore((s) => s.togglePause);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const save = useGameStore((s) => s.save);

  const level = LEVEL_CONFIGS.find((l) => l.id === currentLevelId);
  const levelName = level?.name || "工厂";

  const handleHome = () => {
    save();
    navigate("/");
  };

  return (
    <div className="industrial-panel flex items-center justify-between px-4 py-2 gap-2"
         style={{ minHeight: "48px" }}>
      <div className="flex items-center gap-4">
        <button className="rivet-btn px-2 py-1" onClick={handleHome} title="返回主菜单">
          <Home size={16} />
        </button>
        <span className="font-pixel text-xs text-factory-cream truncate max-w-[120px]">
          {levelName}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-factory-gold font-terminal text-xl">⬡</span>
          <span className="font-terminal text-factory-gold text-xl">{coins}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-factory-green font-terminal text-xl">★</span>
          <span className="font-terminal text-factory-green text-xl">{exp}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="rivet-btn px-2 py-1" onClick={togglePause}>
          {isPaused ? <Play size={16} className="text-factory-green" /> : <Pause size={16} />}
        </button>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              className={`rivet-btn px-2 py-1 text-sm ${speed === s ? "border-factory-accent text-factory-accent" : ""}`}
              onClick={() => setSpeed(s)}
            >
              <FastForward size={14} style={{ opacity: s === 1 ? 0.5 : 1 }} />
            </button>
          ))}
        </div>
        <span className="font-terminal text-factory-cream text-sm">
          ×{speed}
        </span>
        <button className="rivet-btn px-2 py-1" onClick={() => navigate("/settings")}>
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
