import { Coins, Package } from "lucide-react";
import { useGameStore } from "@/store/gameStore";

export default function OfflineReward() {
  const offlineReward = useGameStore((s) => s.offlineReward);
  const claimOfflineReward = useGameStore((s) => s.claimOfflineReward);

  if (!offlineReward) return null;

  const hours = Math.floor(offlineReward.duration);
  const minutes = Math.floor((offlineReward.duration - hours) * 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        className="industrial-panel w-80 p-6 flex flex-col items-center gap-4"
        style={{ animation: "stampIn 0.3s ease-out" }}
      >
        <h3 className="font-pixel text-sm text-factory-gold">离线收益</h3>
        <p className="font-terminal text-factory-cream/70 text-center">
          你离开了 {hours}小时{minutes}分钟
        </p>

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-center gap-2">
            <Coins size={24} className="text-factory-gold" />
            <span className="font-pixel text-lg text-factory-gold">
              +{offlineReward.coins}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package size={20} className="text-factory-green" />
            <span className="font-terminal text-xl text-factory-green">
              +{offlineReward.products} 件产品
            </span>
          </div>
        </div>

        <button
          className="rivet-btn-gold px-6 py-2 text-lg w-full"
          onClick={claimOfflineReward}
          style={{ animation: "stampIn 0.5s ease-out" }}
        >
          领取
        </button>
      </div>
    </div>
  );
}
