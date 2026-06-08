import type {
  GameSave,
  SaveEnvelope,
  LevelProgress,
  GameStatistics,
  ExperimentRecord,
} from '../types/save';
import type { GameSettings, InputDevice, InputAction } from '../types/config';
import { LEVELS } from './config';

export const SAVE_VERSION = '1.0.0';
const SAVE_KEY = 'chem_lab_game_save_v1';

const makeChecksum = (payload: unknown): string => {
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

export const DEFAULT_INPUT_BINDINGS: Record<InputDevice, Record<InputAction, string[]>> = {
  keyboard: {
    select: ['Enter', 'Space'],
    cancel: ['Escape'],
    drag: [''],
    heat_up: ['ArrowUp', 'W'],
    cool_down: ['ArrowDown', 'S'],
    stir: ['R'],
    pour: ['E'],
    menu: ['Escape'],
    pause: ['Escape', 'P'],
    help: ['F1', 'H'],
  },
  mouse: {
    select: ['LMB'],
    cancel: ['RMB'],
    drag: ['LMB'],
    heat_up: ['ScrollUp'],
    cool_down: ['ScrollDown'],
    stir: ['MMB'],
    pour: ['LMB+dbl'],
    menu: ['RMB'],
    pause: [''],
    help: [''],
  },
  gamepad: {
    select: ['A', 'Cross'],
    cancel: ['B', 'Circle'],
    drag: ['RT'],
    heat_up: ['DpadUp', 'RB'],
    cool_down: ['DpadDown', 'LB'],
    stir: ['X', 'Square'],
    pour: ['Y', 'Triangle'],
    menu: ['Start'],
    pause: ['Menu', 'Options'],
    help: ['Back', 'Select'],
  },
  touch: {
    select: ['Tap'],
    cancel: ['LongPress'],
    drag: ['SwipeDrag'],
    heat_up: ['SwipeUp'],
    cool_down: ['SwipeDown'],
    stir: ['Circular'],
    pour: ['DoubleTap'],
    menu: ['SwipeRight'],
    pause: ['TwoFinger'],
    help: ['TripleTap'],
  },
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphics: {
    particlesEnabled: true,
    fluidPrecision: 'medium',
    postProcessing: true,
    bloomIntensity: 0.6,
    targetFPS: 60,
  },
  audio: {
    masterVolume: 0.8,
    sfxVolume: 0.7,
    bgmVolume: 0.3,
    muted: false,
  },
  inputs: {
    keyboard: { device: 'keyboard', bindings: DEFAULT_INPUT_BINDINGS.keyboard },
    mouse: { device: 'mouse', bindings: DEFAULT_INPUT_BINDINGS.mouse },
    gamepad: { device: 'gamepad', bindings: DEFAULT_INPUT_BINDINGS.gamepad },
    touch: { device: 'touch', bindings: DEFAULT_INPUT_BINDINGS.touch },
  },
  currentInputDevice: 'keyboard',
  showPerfStats: false,
  showHints: true,
  language: 'zh-CN',
};

const makeInitialProgress = (): LevelProgress[] =>
  LEVELS.map(level => ({
    levelId: level.id,
    unlocked: !level.prerequisiteLevels || level.prerequisiteLevels.length === 0,
    bestScore: 0,
    stars: 0,
    completed: false,
    attempts: 0,
    bestTime: 0,
    lastPlayed: 0,
  }));

const makeInitialStats = (): GameStatistics => ({
  totalExperiments: 0,
  totalScore: 0,
  accuracyRate: 0,
  safetyRate: 1,
  learnTime: 0,
  totalCorrectSteps: 0,
  totalErrorSteps: 0,
  knowledgeCardsViewed: 0,
});

export const createNewSave = (): GameSave => ({
  version: SAVE_VERSION,
  timestamp: Date.now(),
  playerName: '科学家',
  settings: structuredClone(DEFAULT_SETTINGS),
  progress: makeInitialProgress(),
  statistics: makeInitialStats(),
  records: [],
});

export const serializeSave = (save: GameSave): string => {
  const envelope: SaveEnvelope = {
    version: save.version,
    timestamp: Date.now(),
    checksum: makeChecksum(save),
    payload: save,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(envelope))));
};

export const deserializeSave = (data: string): GameSave | null => {
  try {
    const decoded = JSON.parse(decodeURIComponent(escape(atob(data))));
    if (!decoded.payload || decoded.version !== SAVE_VERSION) {
      console.warn('Save version mismatch or invalid format');
      return null;
    }
    const expectedChecksum = makeChecksum(decoded.payload);
    if (decoded.checksum !== expectedChecksum) {
      console.warn('Save checksum mismatch, data may be corrupted');
    }
    const save = decoded.payload as GameSave;
    if (!save.progress || save.progress.length === 0) {
      save.progress = makeInitialProgress();
    }
    LEVELS.forEach(level => {
      if (!save.progress.find(p => p.levelId === level.id)) {
        save.progress.push({
          levelId: level.id,
          unlocked: !level.prerequisiteLevels || level.prerequisiteLevels.length === 0,
          bestScore: 0, stars: 0, completed: false,
          attempts: 0, bestTime: 0, lastPlayed: 0,
        });
      }
    });
    return save;
  } catch (e) {
    console.error('Failed to deserialize save:', e);
    return null;
  }
};

export const loadSave = (): GameSave => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createNewSave();
    const save = deserializeSave(raw);
    return save || createNewSave();
  } catch {
    return createNewSave();
  }
};

export const writeSave = (save: GameSave): boolean => {
  try {
    save.timestamp = Date.now();
    localStorage.setItem(SAVE_KEY, serializeSave(save));
    return true;
  } catch (e) {
    console.error('Failed to write save:', e);
    return false;
  }
};

export const clearSave = (): void => {
  localStorage.removeItem(SAVE_KEY);
};

export const exportSaveToFile = (save: GameSave): void => {
  const data = serializeSave(save);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chem-lab-save-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importSaveFromFile = async (file: File): Promise<GameSave | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      resolve(deserializeSave(content));
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
};

export const computeStars = (score: number, thresholds: [number, number, number]): number => {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
};

export const addExperimentRecord = (
  save: GameSave,
  record: ExperimentRecord,
): GameSave => {
  const newSave = { ...save, records: [...save.records, record] };
  const progIndex = newSave.progress.findIndex(p => p.levelId === record.levelId);
  if (progIndex >= 0) {
    const prog = newSave.progress[progIndex];
    prog.attempts += 1;
    prog.lastPlayed = record.timestamp;
    if (record.completed) {
      prog.completed = true;
      prog.bestScore = Math.max(prog.bestScore, record.score);
      prog.stars = Math.max(prog.stars, record.stars);
      prog.bestTime = prog.bestTime === 0
        ? record.duration
        : Math.min(prog.bestTime, record.duration);
    }
    newSave.progress = [...newSave.progress];
  }
  const progWithId = newSave.progress.find(p => p.levelId === record.levelId);
  LEVELS.forEach(level => {
    if (level.prerequisiteLevels?.includes(record.levelId) && progWithId?.completed) {
      const nextProg = newSave.progress.find(p => p.levelId === level.id);
      if (nextProg) nextProg.unlocked = true;
    }
  });
  newSave.statistics = updateStats(newSave.statistics, record);
  return newSave;
};

const updateStats = (stats: GameStatistics, record: ExperimentRecord): GameStatistics => {
  const correctSteps = record.steps.filter(s => s.status === 'completed').length;
  const totalSteps = record.steps.length || 1;
  const newCorrect = stats.totalCorrectSteps + correctSteps;
  const newErrors = stats.totalErrorSteps + record.totalErrors;
  const accuracy = newCorrect / Math.max(1, newCorrect + newErrors);
  const safety = 1 - Math.min(1, record.safetyViolations / 10);
  return {
    totalExperiments: stats.totalExperiments + 1,
    totalScore: stats.totalScore + record.score,
    accuracyRate: accuracy,
    safetyRate: (stats.safetyRate * stats.totalExperiments + safety) / (stats.totalExperiments + 1),
    learnTime: stats.learnTime + record.duration,
    totalCorrectSteps: newCorrect,
    totalErrorSteps: newErrors,
    knowledgeCardsViewed: stats.knowledgeCardsViewed + record.knowledgeViewed.length,
  };
};
