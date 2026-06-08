import { EVENT_TYPES } from './EventBus.js';

const STORAGE_KEY = 'railway_dispatch_save_v1';

const DEFAULT_SAVE_DATA = {
  playerName: '调度员',
  totalPlayTime: 0,
  levelsCompleted: [],
  levelStars: {},
  levelBestTimes: {},
  levelBestScores: {},
  settings: {
    audioEnabled: true,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    masterVolume: 0.7,
    showTutorial: true,
    gameSpeed: 1
  },
  statistics: {
    totalGamesPlayed: 0,
    totalWins: 0,
    totalFailures: 0,
    totalConflictsResolved: 0,
    totalTrainsDispatched: 0,
    averageSolveTime: 0
  },
  lastPlayed: null,
  replayHistory: []
};

export class SaveSystem {
  constructor() {
    this.data = null;
    this.autoSaveInterval = null;
    this.currentSession = {
      startTime: null,
      levelActions: [],
      conflicts: [],
      decisions: []
    };
  }

  init() {
    this.load();
    this.setupEventListeners();
    this.startAutoSave();
    return this;
  }

  setupEventListeners() {
    window.EventBus.on(EVENT_TYPES.RECORD_ACTION, this.recordAction.bind(this));
    window.EventBus.on(EVENT_TYPES.LEVEL_COMPLETE, this.onLevelComplete.bind(this));
    window.EventBus.on(EVENT_TYPES.CONFLICT_DETECTED, this.onConflict.bind(this));
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = this.mergeDeep({ ...DEFAULT_SAVE_DATA }, parsed);
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
      }
    } catch (e) {
      console.warn('[SaveSystem] 存档加载失败，使用默认数据', e);
      this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    }
    return this.data;
  }

  save() {
    try {
      this.data.lastPlayed = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      window.EventBus.emit(EVENT_TYPES.SAVE_COMPLETE, this.data);
      return true;
    } catch (e) {
      console.error('[SaveSystem] 存档保存失败', e);
      return false;
    }
  }

  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = setInterval(() => {
      this.save();
    }, 30000);
  }

  startSession(levelId) {
    this.currentSession = {
      levelId,
      startTime: Date.now(),
      startTimeIso: new Date().toISOString(),
      actions: [],
      conflicts: [],
      decisions: [],
      trainsHandled: 0,
      speedChanges: 0
    };
  }

  recordAction(action) {
    if (this.currentSession && this.currentSession.startTime) {
      const timestamp = Date.now() - this.currentSession.startTime;
      this.currentSession.actions.push({
        timestamp,
        ...action
      });
    }
  }

  onConflict(conflict) {
    if (this.currentSession) {
      this.currentSession.conflicts.push({
        time: Date.now() - this.currentSession.startTime,
        type: conflict.type,
        resolved: conflict.resolved || false
      });
    }
  }

  recordDecision(type, details) {
    if (this.currentSession && this.currentSession.startTime) {
      this.currentSession.decisions.push({
        time: Date.now() - this.currentSession.startTime,
        type,
        details
      });
    }
  }

  endSession(result) {
    const sessionData = { ...this.currentSession };
    if (this.currentSession.startTime) {
      sessionData.duration = Date.now() - this.currentSession.startTime;
    }
    sessionData.result = result;

    this.data.totalPlayTime += sessionData.duration || 0;
    this.data.statistics.totalGamesPlayed++;

    if (result.success) {
      this.data.statistics.totalWins++;
    } else {
      this.data.statistics.totalFailures++;
    }

    this.save();
    return sessionData;
  }

  onLevelComplete({ levelId, stars, time, score }) {
    if (!this.data.levelsCompleted.includes(levelId)) {
      this.data.levelsCompleted.push(levelId);
      window.EventBus.emit(EVENT_TYPES.LEVEL_UNLOCK, levelId);
    }

    const prevStars = this.data.levelStars[levelId] || 0;
    this.data.levelStars[levelId] = Math.max(prevStars, stars);

    const prevTime = this.data.levelBestTimes[levelId] || Infinity;
    this.data.levelBestTimes[levelId] = Math.min(prevTime, time);

    const prevScore = this.data.levelBestScores[levelId] || 0;
    this.data.levelBestScores[levelId] = Math.max(prevScore, score);

    this.save();
  }

  isLevelCompleted(levelId) {
    return this.data.levelsCompleted.includes(levelId);
  }

  getLevelStars(levelId) {
    return this.data.levelStars[levelId] || 0;
  }

  isLevelUnlocked(levelId, levelData) {
    if (!levelData) return true;
    if (!levelData.unlockCondition) return true;

    const condition = levelData.unlockCondition;
    if (condition.type === 'stars') {
      return this.getTotalStars() >= condition.value;
    }
    if (condition.type === 'level') {
      return this.isLevelCompleted(condition.levelId);
    }
    return true;
  }

  getTotalStars() {
    return Object.values(this.data.levelStars).reduce((a, b) => a + b, 0);
  }

  getSetting(key) {
    return this.data.settings[key];
  }

  updateSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
  }

  updateStatistics(key, value = 1) {
    this.data.statistics[key] = (this.data.statistics[key] || 0) + value;
  }

  getStatistics() {
    return { ...this.data.statistics };
  }

  saveReplay(replayData) {
    this.data.replayHistory.push({
      ...replayData,
      savedAt: new Date().toISOString()
    });
    this.data.replayHistory = this.data.replayHistory.slice(-20);
    this.save();
  }

  getReplays() {
    return [...this.data.replayHistory];
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    this.save();
  }

  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.data = this.mergeDeep(JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA)), data);
      this.save();
      return true;
    } catch (e) {
      console.error('[SaveSystem] 导入失败', e);
      return false;
    }
  }

  mergeDeep(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        this.mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  getCurrentSession() {
    return { ...this.currentSession };
  }
}
