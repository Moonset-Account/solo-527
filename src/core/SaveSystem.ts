import type {
  SaveData,
  GameSettings,
  PlayerProgress,
  PlayerAnalytics,
  SavedCircuit,
} from '../game/types';

const SAVE_KEY = 'circuit_sandbox_save_v1';
const CURRENT_VERSION = '1.0.0';
const MAX_SAVED_CIRCUITS = 20;

function createDefaultSaveData(): SaveData {
  const now = Date.now();
  return {
    version: CURRENT_VERSION,
    createdAt: now,
    updatedAt: now,
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      volume: 0.7,
      gridVisible: true,
      animationsEnabled: true,
      theme: 'dark',
      autoSave: true,
      showTutorial: true,
      difficulty: 'normal',
    },
    progress: {
      unlockedLevelIds: ['level-001'],
      levelStars: {},
      levelBestTimes: {},
      tutorialCompleted: false,
      tutorialSkipped: false,
    },
    analytics: {
      totalPlayTime: 0,
      levelsAttempted: {},
      levelFailures: {},
      levelRetries: {},
      componentsPlaced: 0,
      wiresDrawn: 0,
      tutorialStepsSkipped: [],
    },
    savedCircuits: [],
  };
}

class SaveSystem {
  private static _instance: SaveSystem | null = null;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): SaveSystem {
    if (!SaveSystem._instance) {
      SaveSystem._instance = new SaveSystem();
    }
    return SaveSystem._instance;
  }

  getData(): SaveData {
    return this.load();
  }

  load(): SaveData {
    try {
      if (typeof localStorage === 'undefined') {
        return createDefaultSaveData();
      }
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return createDefaultSaveData();
      }
      const parsed = JSON.parse(raw) as SaveData;
      if (!parsed || typeof parsed !== 'object' || !parsed.version) {
        return createDefaultSaveData();
      }
      return parsed;
    } catch (_) {
      return createDefaultSaveData();
    }
  }

  save(data: SaveData): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const toSave: SaveData = {
        ...data,
        updatedAt: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    } catch (_) {
      // ignore storage errors
    }
  }

  reset(): SaveData {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SAVE_KEY);
      }
    } catch (_) {
      // ignore
    }
    return createDefaultSaveData();
  }

  exportToJSON(data: SaveData): string {
    return JSON.stringify(data, null, 2);
  }

  importFromJSON(json: string): SaveData {
    const parsed = JSON.parse(json) as SaveData;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('存档数据格式无效');
    }
    if (!parsed.version) {
      throw new Error('存档缺少版本信息');
    }
    const saveMajor = parsed.version.split('.')[0];
    const currentMajor = CURRENT_VERSION.split('.')[0];
    if (saveMajor !== currentMajor) {
      throw new Error(
        `存档版本不兼容：存档版本 ${parsed.version}，当前版本 ${CURRENT_VERSION}`
      );
    }
    if (!parsed.settings || !parsed.progress || !parsed.analytics) {
      throw new Error('存档数据缺少必要字段');
    }
    return parsed;
  }

  downloadSaveFile(data: SaveData, filename: string = 'circuit-sandbox-save.json'): void {
    try {
      const jsonStr = this.exportToJSON(data);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error(`下载存档失败：${(err as Error).message}`);
    }
  }

  triggerFileImport(): Promise<SaveData> {
    return new Promise((resolve, reject) => {
      try {
        if (typeof document === 'undefined') {
          reject(new Error('当前环境不支持文件导入'));
          return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';

        const cleanup = (): void => {
          input.removeEventListener('change', onchange);
          if (input.parentNode) {
            input.parentNode.removeChild(input);
          }
        };

        const onchange = (): void => {
          const file = input.files && input.files[0];
          if (!file) {
            cleanup();
            reject(new Error('未选择文件'));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const result = reader.result as string;
              const imported = this.importFromJSON(result);
              cleanup();
              resolve(imported);
            } catch (err) {
              cleanup();
              reject(err);
            }
          };
          reader.onerror = () => {
            cleanup();
            reject(new Error('读取文件失败'));
          };
          reader.readAsText(file);
        };

        input.addEventListener('change', onchange);
        input.style.display = 'none';
        document.body.appendChild(input);
        input.click();
      } catch (err) {
        reject(err);
      }
    });
  }

  updateSettings(partial: Partial<GameSettings>): SaveData {
    const current = this.load();
    const updated: SaveData = {
      ...current,
      settings: {
        ...current.settings,
        ...partial,
      },
    };
    this.save(updated);
    return updated;
  }

  updateProgress(mutator: (p: PlayerProgress) => void): SaveData {
    const current = this.load();
    mutator(current.progress);
    this.save(current);
    return current;
  }

  updateAnalytics(mutator: (a: PlayerAnalytics) => void): SaveData {
    const current = this.load();
    mutator(current.analytics);
    this.save(current);
    return current;
  }

  saveCircuit(circuit: SavedCircuit): SaveData {
    const current = this.load();
    const existingIndex = current.savedCircuits.findIndex((c) => c.id === circuit.id);

    if (existingIndex >= 0) {
      current.savedCircuits[existingIndex] = circuit;
    } else {
      current.savedCircuits.unshift(circuit);
      if (current.savedCircuits.length > MAX_SAVED_CIRCUITS) {
        current.savedCircuits = current.savedCircuits.slice(0, MAX_SAVED_CIRCUITS);
      }
    }

    this.save(current);
    return current;
  }

  deleteCircuit(id: string): SaveData {
    const current = this.load();
    current.savedCircuits = current.savedCircuits.filter((c) => c.id !== id);
    this.save(current);
    return current;
  }

  autoSaveDebounced(data: SaveData, waitMs: number = 3000): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._debounceTimer = setTimeout(() => {
      this.save(data);
      this._debounceTimer = null;
    }, waitMs);
  }
}

export { SAVE_KEY, CURRENT_VERSION, createDefaultSaveData };
export default SaveSystem;
