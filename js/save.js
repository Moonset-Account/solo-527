// ========================================================
// 存档管理器 - localStorage
// ========================================================

const STORAGE_KEY = 'old_apartment_save_v1';
const SLOT_COUNT = 5;
const AUTO_SLOT = 0;

export class SaveManager {
  constructor(game) {
    this.game = game;
    this.cache = this._loadAll();
  }

  _loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      if (!data.slots) data.slots = {};
      if (!data.settings) data.settings = this._defaultSettings();
      return data;
    } catch (e) {
      console.warn('Load save failed:', e);
      return { slots: {}, settings: this._defaultSettings() };
    }
  }

  _persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache)); }
    catch (e) { console.warn('Persist save failed:', e); }
  }

  _defaultSettings() {
    return {
      volumes: { master: 100, sfx: 100, ambient: 80, ui: 100 },
      display: { brightness: 100, filmgrain: true, vignette: true },
      controls: { sensitivity: 100, fov: 75 },
      gameplay: { autosave: 5, hints: true, subtitles: true },
    };
  }

  // ============== 设置 ==============
  getSettings() { return this.cache.settings || this._defaultSettings(); }
  saveSettings(s) {
    this.cache.settings = { ...this._defaultSettings(), ...s };
    this._persist();
  }

  // ============== 存档 CRUD ==============
  getSlots() {
    const slots = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      slots.push(this.cache.slots[i] || null);
    }
    return slots;
  }

  getSlot(index) { return this.cache.slots[index] || null; }

  saveGame(slotIndex, silent = false) {
    const g = this.game;
    const saveData = {
      slotIndex,
      saveTime: Date.now(),
      chapterId: g.chapterId,
      levelId: g.levelId,
      playTimeSeconds: g.telemetry.getTotalPlayTime(),
      collectedItems: [...g.state.collectedItems],
      readNotes: [...g.state.readNotes],
      solvedPuzzles: [...g.state.solvedPuzzles],
      openedDoors: [...g.state.openedDoors],
      playerPos: { ...g.player.pos, yaw: g.player.yaw, pitch: g.player.pitch },
      completedObjectives: [...g.state.completedObjectives],
      unlockedChapters: [...g.state.unlockedChapters],
      settings: this.getSettings(),
    };
    this.cache.slots[slotIndex] = saveData;
    this._persist();
    return saveData;
  }

  loadGame(slotIndex) {
    const data = this.cache.slots[slotIndex];
    if (!data) return null;
    // 应用到 game 状态
    const g = this.game;
    g.state.collectedItems = new Set(data.collectedItems);
    g.state.readNotes = new Set(data.readNotes);
    g.state.solvedPuzzles = new Set(data.solvedPuzzles);
    g.state.openedDoors = new Set(data.openedDoors);
    g.state.completedObjectives = new Set(data.completedObjectives);
    g.state.unlockedChapters = new Set(data.unlockedChapters);
    g.chapterId = data.chapterId;
    g.levelId = data.levelId;
    g.telemetry.deserialize({
      totalPlaySeconds: data.playTimeSeconds,
      startTime: data.saveTime - data.playTimeSeconds * 1000,
    });
    return {
      levelId: data.levelId,
      chapterId: data.chapterId,
      playerPos: data.playerPos,
    };
  }

  deleteSlot(slotIndex) {
    delete this.cache.slots[slotIndex];
    this._persist();
  }

  hasAnySave() {
    return Object.keys(this.cache.slots).length > 0;
  }

  // 章节完成度（用于关卡选择卡片）
  getChapterProgress(chapterId) {
    const allSaves = Object.values(this.cache.slots).filter(Boolean);
    let best = { completed: false, bestTime: null, completion: 0 };
    for (const s of allSaves) {
      if (s.chapterId >= chapterId || s.unlockedChapters?.includes(chapterId + 1)) {
        best.completed = true;
      }
    }
    return best;
  }

  slotCount() { return SLOT_COUNT; }
  autoSlotIndex() { return AUTO_SLOT; }
}
