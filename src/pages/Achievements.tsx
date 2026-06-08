import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ACHIEVEMENT_DEFS } from "@/config/achievements";
import { useGameStore } from "@/store/gameStore";
import type { AchievementCategory } from "@/game/types";

const CATEGORY_TABS: { key: AchievementCategory | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "production", label: "生产" },
  { key: "order", label: "订单" },
  { key: "upgrade", label: "升级" },
  { key: "special", label: "特殊" },
];

function getAchievementProgress(id: string, stats: ReturnType<typeof useGameStore.getState>["stats"], completedLevels: Record<string, any>): { progress: number; unlocked: boolean } {
  const target = ACHIEVEMENT_DEFS.find(a => a.id === id)?.target ?? 1;
  let progress = 0;
  let unlocked = false;

  switch (id) {
    case "first_product":
      progress = stats.totalProductsMade;
      unlocked = stats.totalProductsMade >= target;
      break;
    case "speed_demon":
      progress = stats.totalDeliveries >= 5 && stats.totalPlayTime <= 60 ? 1 : 0;
      unlocked = stats.totalDeliveries >= 5 && stats.totalPlayTime <= 60;
      break;
    case "mass_production":
      progress = stats.totalProductsMade;
      unlocked = stats.totalProductsMade >= target;
      break;
    case "first_order":
      progress = stats.totalDeliveries;
      unlocked = stats.totalDeliveries >= target;
      break;
    case "order_master":
      progress = stats.totalDeliveries;
      unlocked = stats.totalDeliveries >= target;
      break;
    case "elite_handler":
      progress = stats.ordersByDifficulty.elite;
      unlocked = stats.ordersByDifficulty.elite >= target;
      break;
    case "first_upgrade":
      progress = stats.totalUpgrades;
      unlocked = stats.totalUpgrades >= target;
      break;
    case "maxed_out":
      progress = Object.values(completedLevels).some((l: any) => l.stars >= 3) ? 1 : 0;
      unlocked = Object.values(completedLevels).some((l: any) => l.stars >= 3);
      break;
    case "upgrade_frenzy":
      progress = stats.totalUpgrades;
      unlocked = stats.totalUpgrades >= target;
      break;
    case "no_rejects":
      progress = 0;
      unlocked = false;
      break;
    case "bottleneck_free":
      progress = stats.bottleneckCount === 0 && stats.totalDeliveries >= 5 ? 1 : 0;
      unlocked = stats.bottleneckCount === 0 && stats.totalDeliveries >= 5;
      break;
    case "offline_collector":
      progress = stats.totalProductsMade;
      unlocked = stats.totalProductsMade >= target;
      break;
    default:
      break;
  }

  return { progress: Math.min(progress, target), unlocked };
}

export default function Achievements() {
  const navigate = useNavigate();
  const stats = useGameStore((s) => s.stats);
  const completedLevels = useGameStore((s) => s.completedLevels);
  const [filter, setFilter] = useState<AchievementCategory | "all">("all");

  const achievements = ACHIEVEMENT_DEFS.map((def) => {
    const { progress, unlocked } = getAchievementProgress(def.id, stats, completedLevels);
    return { ...def, progress, unlocked };
  });

  const filtered = filter === "all" ? achievements : achievements.filter((a) => a.category === filter);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen bg-factory-dark flex flex-col">
      <div className="industrial-panel flex items-center justify-between px-4 py-2">
        <button className="rivet-btn px-3 py-1" onClick={() => navigate("/")}>
          <ArrowLeft size={16} className="inline mr-1" />
          返回
        </button>
        <h2 className="font-pixel text-xs text-factory-gold">成就</h2>
        <span className="font-terminal text-factory-cream/70">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="flex gap-1 px-4 py-2 overflow-x-auto">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`rivet-btn px-3 py-1 text-sm whitespace-nowrap ${filter === tab.key ? "border-factory-accent text-factory-accent" : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {filtered.map((achievement) => (
            <div
              key={achievement.id}
              className={`industrial-panel p-3 transition-all ${
                achievement.unlocked
                  ? "border-factory-gold shadow-[0_0_8px_rgba(212,168,75,0.3)]"
                  : "opacity-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl ${achievement.unlocked ? "" : "grayscale"}`}>
                  {achievement.unlocked ? achievement.icon : "🔒"}
                </span>
                <div>
                  <div className={`font-terminal text-sm ${achievement.unlocked ? "text-factory-gold" : "text-factory-cream/50"}`}>
                    {achievement.name}
                  </div>
                  <div className="font-terminal text-xs text-factory-cream/50">
                    {achievement.description}
                  </div>
                </div>
              </div>
              <div className="w-full bg-factory-dark h-2">
                <div
                  className={`h-full transition-all ${achievement.unlocked ? "bg-factory-gold" : "bg-factory-border"}`}
                  style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                />
              </div>
              <div className="font-terminal text-xs text-factory-cream/40 mt-1 text-right">
                {achievement.progress}/{achievement.target}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
