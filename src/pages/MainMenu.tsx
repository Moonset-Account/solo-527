import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Factory, Trophy, BarChart3, Settings, Play } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import OfflineReward from "@/components/OfflineReward";

export default function MainMenu() {
  const navigate = useNavigate();
  const hasSave = useGameStore((s) => s.hasSave);
  const load = useGameStore((s) => s.load);
  const offlineReward = useGameStore((s) => s.offlineReward);
  const calculateOfflineReward = useGameStore((s) => s.calculateOfflineReward);
  const setHasSave = useGameStore((s) => s.setHasSave);

  useEffect(() => {
    const raw = localStorage.getItem("retro_factory_save");
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.version && data.coins !== undefined) {
          setHasSave(true);
          if (data.lastSaveTime) {
            calculateOfflineReward();
          }
        }
      } catch {
        // ignore
      }
    }
  }, [setHasSave, calculateOfflineReward]);

  const handleContinue = () => {
    load();
    navigate("/level-select");
  };

  const handleNewGame = () => {
    load();
    navigate("/level-select");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-factory-dark">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-24 h-24 border-4 border-factory-border/30 rounded-full animate-gearSpin" />
        <div className="absolute top-[20%] right-[8%] w-16 h-16 border-4 border-factory-border/20 rounded-full animate-gearSpin" style={{ animationDirection: "reverse", animationDuration: "6s" }} />
        <div className="absolute bottom-[15%] left-[12%] w-20 h-20 border-4 border-factory-border/25 rounded-full animate-gearSpin" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-[25%] right-[15%] w-28 h-28 border-4 border-factory-border/15 rounded-full animate-gearSpin" style={{ animationDirection: "reverse", animationDuration: "8s" }} />
        <div className="absolute top-[60%] left-[50%] w-12 h-12 border-4 border-factory-border/20 rounded-full animate-gearSpin" style={{ animationDuration: "3s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Factory size={40} className="text-factory-accent" />
          </div>
          <h1 className="font-pixel text-2xl text-factory-gold mb-3">复古工厂</h1>
          <p className="font-terminal text-xl text-factory-cream/60">流水线放置游戏</p>
        </div>

        <div className="flex flex-col gap-3 w-64">
          <button
            className="rivet-btn-primary px-6 py-3 text-xl"
            onClick={handleNewGame}
          >
            <Play size={20} className="inline mr-2" />
            开始游戏
          </button>

          <button
            className="rivet-btn px-6 py-3 text-xl"
            onClick={handleContinue}
            disabled={!hasSave}
          >
            继续游戏
          </button>

          <div className="border-t border-factory-border my-2" />

          <button
            className="rivet-btn px-6 py-2 text-lg"
            onClick={() => navigate("/achievements")}
          >
            <Trophy size={18} className="inline mr-2 text-factory-gold" />
            成就
          </button>

          <button
            className="rivet-btn px-6 py-2 text-lg"
            onClick={() => navigate("/stats")}
          >
            <BarChart3 size={18} className="inline mr-2 text-factory-green" />
            统计
          </button>

          <button
            className="rivet-btn px-6 py-2 text-lg"
            onClick={() => navigate("/settings")}
          >
            <Settings size={18} className="inline mr-2 text-factory-cream/70" />
            设置
          </button>
        </div>
      </div>

      {offlineReward && <OfflineReward />}
    </div>
  );
}
