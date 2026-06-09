const STORAGE_KEY = 'city_emergency_save_v1';
const DAILY_KEY = 'city_emergency_daily_v1';

export class SaveManager {
    constructor() {
        this.data = this._defaultData();
        this.listeners = [];
        this._loaded = false;
    }

    _defaultData() {
        return {
            settings: {
                musicVolume: 0.5,
                sfxVolume: 0.7,
                audioEnabled: true,
                language: 'zh-CN',
                showGrid: true,
                cameraSpeed: 1.0
            },
            progress: {
                levelsCompleted: [],
                levelStars: {},
                levelBestScore: {},
                totalPlayTime: 0
            },
            stats: {
                levelsCompleted: 0,
                totalEventsHandled: 0,
                totalBudgetEarned: 0,
                eventStats: {},
                fastestBatch5: null,
                maxEndBudget: 0,
                maxSatisfaction: 0,
                perfectRuns: 0,
                totalFailures: 0
            },
            achievements: [],
            currentGame: null,
            lastSaved: null
        };
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.data = { ...this._defaultData(), ...parsed };
                for (const key of Object.keys(this._defaultData())) {
                    if (typeof this._defaultData()[key] === 'object' && this._defaultData()[key] !== null) {
                        this.data[key] = { ...this._defaultData()[key], ...(parsed[key] || {}) };
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load save', e);
        }
        this._loaded = true;
        return this.data;
    }

    save() {
        try {
            this.data.lastSaved = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            this._notify();
        } catch (e) {
            console.warn('Failed to save', e);
        }
    }

    _notify() {
        for (const cb of this.listeners) {
            try { cb(this.data); } catch (e) {}
        }
    }

    onChange(callback) {
        this.listeners.push(callback);
        return () => {
            const idx = this.listeners.indexOf(callback);
            if (idx >= 0) this.listeners.splice(idx, 1);
        };
    }

    getSettings() {
        return { ...this.data.settings };
    }

    updateSettings(patch) {
        this.data.settings = { ...this.data.settings, ...patch };
        this.save();
    }

    getProgress() {
        return { ...this.data.progress };
    }

    completeLevel(levelId, stars, score) {
        if (!this.data.progress.levelsCompleted.includes(levelId)) {
            this.data.progress.levelsCompleted.push(levelId);
        }
        const prevStars = this.data.progress.levelStars[levelId] || 0;
        this.data.progress.levelStars[levelId] = Math.max(prevStars, stars);
        const prevScore = this.data.progress.levelBestScore[levelId] || 0;
        this.data.progress.levelBestScore[levelId] = Math.max(prevScore, score);
        this.data.stats.levelsCompleted = this.data.progress.levelsCompleted.length;
        this.save();
    }

    getStats() {
        return { ...this.data.stats, eventStats: { ...this.data.stats.eventStats } };
    }

    updateStats(patch) {
        for (const [k, v] of Object.entries(patch)) {
            if (k === 'eventStats') {
                for (const [ek, ev] of Object.entries(v)) {
                    this.data.stats.eventStats[ek] = (this.data.stats.eventStats[ek] || 0) + ev;
                }
            } else if (k in this.data.stats) {
                if (typeof v === 'number' && k.startsWith('max')) {
                    this.data.stats[k] = Math.max(this.data.stats[k], v);
                } else if (k === 'fastestBatch5') {
                    if (this.data.stats.fastestBatch5 === null || v < this.data.stats.fastestBatch5) {
                        this.data.stats.fastestBatch5 = v;
                    }
                } else {
                    this.data.stats[k] += v;
                }
            }
        }
        this.save();
    }

    unlockAchievement(id) {
        if (!this.data.achievements.includes(id)) {
            this.data.achievements.push(id);
            this.save();
            return true;
        }
        return false;
    }

    getAchievements() {
        return [...this.data.achievements];
    }

    saveCurrentGame(gameState) {
        this.data.currentGame = {
            ...gameState,
            savedAt: new Date().toISOString()
        };
        this.save();
    }

    loadCurrentGame() {
        return this.data.currentGame;
    }

    clearCurrentGame() {
        this.data.currentGame = null;
        this.save();
    }

    resetAll() {
        this.data = this._defaultData();
        this.save();
    }

    getDailyChallenge() {
        const today = new Date().toDateString();
        try {
            const raw = localStorage.getItem(DAILY_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data.date === today) return data;
            }
        } catch (e) {}
        return null;
    }

    saveDailyChallenge(score, stars) {
        const today = new Date().toDateString();
        const data = { date: today, score, stars, completedAt: new Date().toISOString() };
        localStorage.setItem(DAILY_KEY, JSON.stringify(data));
        return data;
    }

    getLeaderboard() {
        try {
            const raw = localStorage.getItem('city_emergency_leaderboard_v1');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    addToLeaderboard(name, score, levelId) {
        const board = this.getLeaderboard();
        board.push({
            name,
            score,
            levelId,
            date: new Date().toISOString()
        });
        board.sort((a, b) => b.score - a.score);
        const top = board.slice(0, 10);
        localStorage.setItem('city_emergency_leaderboard_v1', JSON.stringify(top));
        return top;
    }
}
