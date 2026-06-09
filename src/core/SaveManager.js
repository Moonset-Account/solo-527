import { globalEventBus, EVENTS } from '../core/EventBus.js';
import { formatTime, clamp } from '../core/Utils.js';
import { configManager, GAME_STATES, RESOURCE_TYPE, TASK_TYPE } from '../config/GameConfig.js';

export class SaveManager {
  constructor() {
    this.key = 'mini_city_dispatch_save_v1';
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {
      unlockedLevels: [1],
      levelStars: {},
      bestScores: {},
      totalPlayTime: 0,
      settings: {
        sound: true, music: true, vibration: true,
      },
    };
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) { /* ignore */ }
  }

  isLevelUnlocked(id) { return this.data.unlockedLevels.includes(id); }

  getLevelStars(id) { return this.data.levelStars[id] || 0; }
  getBestScore(id) { return this.data.bestScores[id] || 0; }

  recordLevelResult(levelId, stars, score) {
    const prev = this.getLevelStars(levelId);
    if (stars > prev) this.data.levelStars[levelId] = stars;
    const prevScore = this.getBestScore(levelId);
    if (score > prevScore) this.data.bestScores[levelId] = score;
    if (stars > 0) {
      const next = levelId + 1;
      if (!this.data.unlockedLevels.includes(next) && next <= configManager.getLevelCount()) {
        this.data.unlockedLevels.push(next);
      }
    }
    this.save();
    return {
      newlyUnlocked: stars > 0 && !this.data.unlockedLevels.includes(levelId) ? levelId : null,
      nextLevel: next,
      nextUnlocked: this.data.unlockedLevels.includes(next),
    };
  }

  updateSetting(k, v) { this.data.settings[k] = v; this.save(); }
  getSetting(k) { return this.data.settings[k]; }
}

export const saveManager = new SaveManager();
