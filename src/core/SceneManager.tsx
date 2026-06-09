import { useEffect, useRef } from 'react';
import useGameStore, { type SceneId } from '@/store/useGameStore';
import { MenuScene, LevelSelectScene, SettingsScene, ResultScene, SavedCircuitsScene } from '@/scenes';
import SandboxScene from '@/scenes/SandboxScene';

const sceneRegistry: Record<SceneId, React.ComponentType> = {
  menu: MenuScene,
  'level-select': LevelSelectScene,
  sandbox: SandboxScene,
  settings: SettingsScene,
  result: ResultScene,
  'saved-circuits': SavedCircuitsScene,
};

interface SceneManagerProps {}

export default function SceneManager(_props: SceneManagerProps) {
  const currentScene = useGameStore((s: any) => s.currentScene);
  const sceneHistoryRef = useRef<SceneId[]>(['menu']);

  useEffect(() => {
    const last = sceneHistoryRef.current[sceneHistoryRef.current.length - 1];
    if (last !== currentScene) {
      sceneHistoryRef.current.push(currentScene);
      if (sceneHistoryRef.current.length > 10) {
        sceneHistoryRef.current.shift();
      }
    }
  }, [currentScene]);

  const sceneKey = (currentScene in sceneRegistry ? currentScene : 'menu') as SceneId;
  const SceneComponent = sceneRegistry[sceneKey] ?? MenuScene;

  return (
    <div
      key={currentScene}
      className="w-full h-full animate-fadeIn"
      style={{ animation: 'fadeIn 0.35s ease-out both' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <SceneComponent />
    </div>
  );
}
