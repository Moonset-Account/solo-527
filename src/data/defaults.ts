import type { GameSettings, ComponentCategory } from '../game/types';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  volume: 0.7,
  gridVisible: true,
  animationsEnabled: true,
  theme: 'dark',
  autoSave: true,
  showTutorial: true,
  difficulty: 'normal',
  audioEnabled: true,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  tutorialEnabled: true,
  autoSaveEnabled: true,
};

export const DEFAULT_CIRCUIT_CAPACITY = 20;

export const MAX_WIRES = 50;

export const GRID_SIZE = 20;

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    key: 'source',
    label: '电源',
    icon: '🔋',
  },
  {
    key: 'passive',
    label: '无源元件',
    icon: '⚡',
  },
  {
    key: 'active',
    label: '控制元件',
    icon: '🔘',
  },
  {
    key: 'output',
    label: '输出元件',
    icon: '💡',
  },
];
