import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from '@/pages/HomePage';
import GamePage from '@/pages/GamePage';
import SandboxPage from '@/pages/SandboxPage';
import EditorPage from '@/pages/EditorPage';
import SettingsPage from '@/pages/SettingsPage';
import { useGameStore } from '@/store/useGameStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function App() {
  const loadCompletedLevels = useGameStore((s) => s.loadCompletedLevels);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadCompletedLevels();
    loadSettings();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:levelId" element={<GamePage />} />
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}
