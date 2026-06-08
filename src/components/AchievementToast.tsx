import { useEffect } from "react";
import { Cog } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import type { AchievementDef } from "@/game/types";

export default function AchievementToast() {
  const newAchievements = useGameStore((s) => s.newAchievements);
  const dismissAchievement = useGameStore((s) => s.dismissAchievement);

  if (newAchievements.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {newAchievements.map((achievement) => (
        <AchievementToastItem
          key={achievement.id}
          achievement={achievement}
          onDismiss={() => dismissAchievement(achievement.id)}
        />
      ))}
    </div>
  );
}

function AchievementToastItem({
  achievement,
  onDismiss,
}: {
  achievement: AchievementDef;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="w-72 industrial-panel p-3 border-2 border-factory-gold"
      style={{
        animation: "slideIn 0.3s ease-out",
        boxShadow: "0 0 12px rgba(212, 168, 75, 0.5), inset 0 0 8px rgba(212, 168, 75, 0.1)",
      }}
    >
      <div className="flex items-center gap-2">
        <Cog size={20} className="text-factory-gold animate-gearSpin" />
        <div className="flex-1">
          <div className="font-pixel text-[9px] text-factory-gold mb-0.5">成就解锁!</div>
          <div className="font-terminal text-factory-cream text-sm">{achievement.name}</div>
          <div className="font-terminal text-factory-cream/60 text-xs">{achievement.description}</div>
        </div>
      </div>
    </div>
  );
}
