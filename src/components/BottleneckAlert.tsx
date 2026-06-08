import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpCircle } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import type { BottleneckInfo } from "@/game/types";

export default function BottleneckAlert() {
  const bottlenecks = useGameStore((s) => s.bottlenecks);
  const selectMachineForUpgrade = useGameStore((s) => s.selectMachineForUpgrade);
  const [visibleBottlenecks, setVisibleBottlenecks] = useState<BottleneckInfo[]>([]);

  useEffect(() => {
    if (bottlenecks.length > 0) {
      setVisibleBottlenecks((prev) => {
        const newOnes = bottlenecks.filter(
          (b) => !prev.some((p) => p.x === b.x && p.y === b.y)
        );
        return [...prev, ...newOnes];
      });
    }
  }, [bottlenecks]);

  useEffect(() => {
    if (visibleBottlenecks.length === 0) return;
    const timer = setTimeout(() => {
      setVisibleBottlenecks((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [visibleBottlenecks]);

  const handleUpgrade = (bn: BottleneckInfo) => {
    selectMachineForUpgrade(bn.x, bn.y);
    setVisibleBottlenecks((prev) => prev.filter((b) => !(b.x === bn.x && b.y === bn.y)));
  };

  if (visibleBottlenecks.length === 0) return null;

  const current = visibleBottlenecks[0];

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-72 animate-slideIn"
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      <div
        className="industrial-panel p-3 border-2 border-factory-gold"
        style={{ animation: "pulse 1s ease-in-out infinite" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} className="text-factory-gold" />
          <span className="font-pixel text-[9px] text-factory-gold">瓶颈警告</span>
        </div>
        <div className="font-terminal text-factory-cream mb-1">
          位置 ({current.x},{current.y})
        </div>
        <div className="font-terminal text-factory-cream/70 text-sm mb-2">
          积压: {current.queueSize} 件产品
        </div>
        <button
          className="rivet-btn-gold px-3 py-1 text-sm w-full"
          onClick={() => handleUpgrade(current)}
        >
          <ArrowUpCircle size={14} className="inline mr-1" />
          升级
        </button>
      </div>
    </div>
  );
}
