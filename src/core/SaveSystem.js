export class SaveSystem {
  constructor() {
    this.STORAGE_KEY = 'traffic_sim_save_v1';
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.getDefaultSave();
      const data = JSON.parse(raw);
      return { ...this.getDefaultSave(), ...data };
    } catch (err) {
      console.warn('[SaveSystem] 读取存档失败，使用默认存档:', err);
      return this.getDefaultSave();
    }
  }

  save(data) {
    try {
      const current = this.load();
      const merged = { ...current, ...data, lastSaved: Date.now() };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      return true;
    } catch (err) {
      console.error('[SaveSystem] 保存失败:', err);
      return false;
    }
  }

  getDefaultSave() {
    return {
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        masterVolume: 0.7
      },
      progress: {
        unlockedLevels: ['level_1'],
        levelStars: {},
        levelScores: {},
        completedLevels: []
      },
      sandbox: {
        lastParams: null,
        bestMetrics: null
      },
      trialHistory: [],
      lastSaved: null
    };
  }

  completeLevel(levelId, stars, score, metrics) {
    const data = this.load();
    const existingStars = data.progress.levelStars[levelId] || 0;
    data.progress.levelStars[levelId] = Math.max(existingStars, stars);
    data.progress.levelScores[levelId] = Math.max(data.progress.levelScores[levelId] || 0, score);

    if (!data.progress.completedLevels.includes(levelId)) {
      data.progress.completedLevels.push(levelId);
    }

    const nextLevel = this.getNextLevelId(levelId);
    if (nextLevel && !data.progress.unlockedLevels.includes(nextLevel)) {
      data.progress.unlockedLevels.push(nextLevel);
    }

    data.trialHistory.push({
      type: 'level',
      levelId,
      stars,
      score,
      metrics,
      timestamp: Date.now()
    });

    if (data.trialHistory.length > 100) {
      data.trialHistory = data.trialHistory.slice(-100);
    }

    this.save(data);
    return data;
  }

  saveSandboxTrial(params, metrics) {
    const data = this.load();
    data.sandbox.lastParams = params;
    if (!data.sandbox.bestMetrics || metrics.overallScore > data.sandbox.bestMetrics.overallScore) {
      data.sandbox.bestMetrics = metrics;
    }
    data.trialHistory.push({
      type: 'sandbox',
      params,
      metrics,
      timestamp: Date.now()
    });
    if (data.trialHistory.length > 100) {
      data.trialHistory = data.trialHistory.slice(-100);
    }
    this.save(data);
    return data;
  }

  isLevelUnlocked(levelId) {
    const data = this.load();
    return data.progress.unlockedLevels.includes(levelId);
  }

  getLevelStars(levelId) {
    const data = this.load();
    return data.progress.levelStars[levelId] || 0;
  }

  getNextLevelId(levelId) {
    const order = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5'];
    const idx = order.indexOf(levelId);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  }

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getSettings() {
    return this.load().settings;
  }

  saveSettings(settings) {
    const data = this.load();
    data.settings = { ...data.settings, ...settings };
    this.save(data);
    return data.settings;
  }
}

export const saveSystem = new SaveSystem();
