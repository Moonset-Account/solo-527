import { useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { soundManager } from "@/game/sound";
import TopBar from "@/components/TopBar";
import GameCanvas from "@/components/GameCanvas";
import MachinePanel from "@/components/MachinePanel";
import OrderPanel from "@/components/OrderPanel";
import UpgradeModal from "@/components/UpgradeModal";
import BottleneckAlert from "@/components/BottleneckAlert";
import OfflineReward from "@/components/OfflineReward";
import AchievementToast from "@/components/AchievementToast";
import LevelCompleteModal from "@/components/LevelCompleteModal";

export default function Factory() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const initLevel = useGameStore((s) => s.initLevel);
  const update = useGameStore((s) => s.update);
  const isPaused = useGameStore((s) => s.isPaused);
  const speed = useGameStore((s) => s.speed);
  const save = useGameStore((s) => s.save);
  const bottlenecks = useGameStore((s) => s.bottlenecks);
  const upgradeTarget = useGameStore((s) => s.upgradeTarget);
  const offlineReward = useGameStore((s) => s.offlineReward);
  const newAchievements = useGameStore((s) => s.newAchievements);
  const levelCompleteInfo = useGameStore((s) => s.levelCompleteInfo);
  const autoSave = useUIStore((s) => s.autoSave);

  const lastTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const saveTimerRef = useRef<number>(0);

  useEffect(() => {
    if (levelId) {
      initLevel(levelId);
    }
  }, [levelId, initLevel]);

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      update(delta);

      if (autoSave) {
        saveTimerRef.current += delta;
        if (saveTimerRef.current >= 30) {
          save();
          saveTimerRef.current = 0;
        }
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [update, save, autoSave]
  );

  useEffect(() => {
    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop]);

  const handleBack = useCallback(() => {
    save();
    navigate("/level-select");
  }, [save, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      save();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [save]);

  return (
    <div className="h-screen flex flex-col bg-factory-dark overflow-hidden">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <GameCanvas />
        </div>
        <OrderPanel />
      </div>

      <MachinePanel />

      {bottlenecks.length > 0 && <BottleneckAlert />}
      {upgradeTarget && <UpgradeModal />}
      {offlineReward && <OfflineReward />}
      {newAchievements.length > 0 && <AchievementToast />}
      {levelCompleteInfo && <LevelCompleteModal info={levelCompleteInfo} />}
    </div>
  );
}
