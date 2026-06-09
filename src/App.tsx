import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import MainMenu from "@/pages/MainMenu";
import LevelSelect from "@/pages/LevelSelect";
import GameScene from "@/pages/GameScene";
import Sandbox from "@/pages/Sandbox";
import Statistics from "@/pages/Statistics";
import { saveManager } from "@/game/SaveManager";
import { useGameStore } from "@/store/useGameStore";

function AppRoutes() {
  const refreshUnlockedLevels = useGameStore((s) => s.refreshUnlockedLevels);

  useEffect(() => {
    refreshUnlockedLevels();
    saveManager.load();
  }, [refreshUnlockedLevels]);

  return (
    <div
      className="min-h-screen w-full bg-[#0a1628] text-white overflow-hidden"
      style={{ fontFamily: '"Rajdhani", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/levels" element={<LevelSelect />} />
        <Route path="/game/:levelId" element={<GameScene />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route
          path="*" element={<MainMenu />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
