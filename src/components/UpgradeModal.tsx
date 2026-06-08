import { X, ArrowUpCircle, Zap, Shield, Box } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { MACHINE_TYPES } from "@/config/machines";

export default function UpgradeModal() {
  const upgradeTarget = useGameStore((s) => s.upgradeTarget);
  const coins = useGameStore((s) => s.coins);
  const closeUpgradeModal = useGameStore((s) => s.closeUpgradeModal);
  const upgradeMachine = useGameStore((s) => s.upgradeMachine);

  if (!upgradeTarget) return null;

  const machineType = MACHINE_TYPES[upgradeTarget.type];
  if (!machineType) return null;

  const isMaxLevel = upgradeTarget.level >= machineType.maxLevel;
  const upgradeCost = isMaxLevel
    ? 0
    : Math.floor(machineType.cost * Math.pow(machineType.upgradeCostMultiplier, upgradeTarget.level - 1));
  const canAfford = coins >= upgradeCost;

  const currentSpeed = machineType.baseSpeed / upgradeTarget.level;
  const nextSpeed = machineType.baseSpeed / (upgradeTarget.level + 1);
  const currentQuality = machineType.baseQuality + (upgradeTarget.level - 1) * 0.02;
  const nextQuality = Math.min(1, machineType.baseQuality + upgradeTarget.level * 0.02);
  const currentBuffer = machineType.bufferCapacity + Math.floor((upgradeTarget.level - 1) / 3);
  const nextBuffer = machineType.bufferCapacity + Math.floor(upgradeTarget.level / 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="industrial-panel w-80 p-0" style={{ animation: "stampIn 0.3s ease-out" }}>
        <div className="flex items-center justify-between px-4 py-2 border-b-2 border-factory-border bg-factory-dark/50">
          <h3 className="font-pixel text-[10px] text-factory-gold">{machineType.name}</h3>
          <button
            className="text-factory-cream/70 hover:text-factory-cream cursor-pointer"
            onClick={closeUpgradeModal}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-terminal text-lg text-factory-cream">当前等级</span>
            <span className="font-pixel text-sm text-factory-gold">Lv.{upgradeTarget.level}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-factory-dark/50 border border-factory-border">
              <Zap size={16} className="mx-auto mb-1 text-factory-accent" />
              <div className="font-terminal text-xs text-factory-cream/70">速度</div>
              <div className="font-terminal text-factory-cream">{currentSpeed.toFixed(1)}s</div>
            </div>
            <div className="text-center p-2 bg-factory-dark/50 border border-factory-border">
              <Shield size={16} className="mx-auto mb-1 text-factory-green" />
              <div className="font-terminal text-xs text-factory-cream/70">质量</div>
              <div className="font-terminal text-factory-cream">{(Math.min(1, currentQuality) * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center p-2 bg-factory-dark/50 border border-factory-border">
              <Box size={16} className="mx-auto mb-1 text-factory-gold" />
              <div className="font-terminal text-xs text-factory-cream/70">容量</div>
              <div className="font-terminal text-factory-cream">{currentBuffer}</div>
            </div>
          </div>

          {!isMaxLevel && (
            <>
              <div className="border-t border-factory-border pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-terminal text-lg text-factory-cream">升级后</span>
                  <span className="font-pixel text-sm text-factory-green">Lv.{upgradeTarget.level + 1}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-factory-green/10 border border-factory-green/30">
                    <div className="font-terminal text-xs text-factory-cream/70">速度</div>
                    <div className="font-terminal text-factory-green">{nextSpeed.toFixed(1)}s</div>
                  </div>
                  <div className="text-center p-2 bg-factory-green/10 border border-factory-green/30">
                    <div className="font-terminal text-xs text-factory-cream/70">质量</div>
                    <div className="font-terminal text-factory-green">{(nextQuality * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-center p-2 bg-factory-green/10 border border-factory-green/30">
                    <div className="font-terminal text-xs text-factory-cream/70">容量</div>
                    <div className="font-terminal text-factory-green">{nextBuffer}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="font-terminal text-factory-gold">升级费用: ⬡{upgradeCost}</span>
                <button
                  className="rivet-btn-primary px-4 py-2"
                  onClick={upgradeMachine}
                  disabled={!canAfford}
                >
                  <ArrowUpCircle size={16} className="inline mr-1" />
                  升级
                </button>
              </div>
            </>
          )}

          {isMaxLevel && (
            <div className="text-center font-terminal text-factory-gold text-lg py-2">
              ★ 已达最高等级 ★
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
