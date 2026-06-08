import { useEffect } from 'react';
import { useGameNavStore } from './store/useGameNavStore';
import { useSaveStore } from './store/useSaveStore';
import { MainMenuPage } from './components/menu/MainMenuPage';
import { LevelsPage } from './components/levels/LevelsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ResultPage } from './components/result/ResultPage';
import { GameCanvas } from './components/game/GameCanvas';

export default function App() {
  const route = useGameNavStore(s => s.currentRoute);
  const selectedLevelId = useGameNavStore(s => s.selectedLevelId);
  const lastResult = useGameNavStore(s => s.lastResult);
  const setResult = useGameNavStore(s => s.setResult);
  const navigate = useGameNavStore(s => s.navigate);
  const loadSave = useSaveStore(s => s.load);

  useEffect(() => {
    loadSave();
  }, [loadSave]);

  const handleComplete = (result: Parameters<typeof setResult>[0]) => {
    setResult(result);
  };

  if (route === 'game' && selectedLevelId) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <GameCanvas
          levelId={selectedLevelId}
          onComplete={handleComplete}
          onExit={() => navigate('levels')}
        />
      </div>
    );
  }

  if (route === 'result' && lastResult && selectedLevelId) {
    return <ResultPage levelId={selectedLevelId} result={lastResult} />;
  }

  if (route === 'settings') return <SettingsPage />;
  if (route === 'levels') return <LevelsPage />;
  return <MainMenuPage />;
}
