import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Coins, Clock, AlertTriangle, Box, ArrowUpCircle, Truck } from "lucide-react";
import { useGameStore } from "@/store/gameStore";

const statCards = [
  { key: "totalDeliveries", label: "总交付数", icon: Truck, color: "text-factory-accent" },
  { key: "totalCoinsEarned", label: "总收入", icon: Coins, color: "text-factory-gold" },
  { key: "totalPlayTime", label: "游戏时长(秒)", icon: Clock, color: "text-factory-cream" },
  { key: "bottleneckCount", label: "瓶颈次数", icon: AlertTriangle, color: "text-factory-red" },
  { key: "totalProductsMade", label: "总产品数", icon: Box, color: "text-factory-green" },
  { key: "totalUpgrades", label: "总升级次数", icon: ArrowUpCircle, color: "text-factory-accent" },
] as const;

const difficultyLabels: Record<string, string> = {
  easy: "简单订单",
  normal: "普通订单",
  hard: "困难订单",
  elite: "精英订单",
};

export default function Stats() {
  const navigate = useNavigate();
  const stats = useGameStore((s) => s.stats);

  return (
    <div className="min-h-screen bg-factory-dark flex flex-col">
      <div className="industrial-panel flex items-center justify-between px-4 py-2">
        <button className="rivet-btn px-3 py-1" onClick={() => navigate("/")}>
          <ArrowLeft size={16} className="inline mr-1" />
          返回
        </button>
        <h2 className="font-pixel text-xs text-factory-gold">统计</h2>
        <div />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {statCards.map((card) => {
            const Icon = card.icon;
            const value = stats[card.key as keyof typeof stats];
            return (
              <div key={card.key} className="industrial-panel p-4 flex items-center gap-3">
                <Icon size={28} className={card.color} />
                <div>
                  <div className="font-terminal text-sm text-factory-cream/60">{card.label}</div>
                  <div className={`font-terminal text-2xl ${card.color}`}>
                    {typeof value === "number" ? value.toLocaleString() : String(value)}
                  </div>
                </div>
              </div>
            );
          })}

          {Object.entries(stats.ordersByDifficulty).map(([difficulty, count]) => (
            <div key={difficulty} className="industrial-panel p-4 flex items-center gap-3">
              <Package size={28} className="text-factory-cream/70" />
              <div>
                <div className="font-terminal text-sm text-factory-cream/60">
                  {difficultyLabels[difficulty] || difficulty}
                </div>
                <div className="font-terminal text-2xl text-factory-cream">
                  {count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
