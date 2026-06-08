// ========================================================
// 试玩数据记录系统 (Telemetry)
// ========================================================

export class TelemetryManager {
  constructor() {
    this.sessionId = this._genId();
    this.startTime = Date.now();
    this.endTime = null;
    this.totalPlaySeconds = 0;
    this.chaptersPlayed = [];     // FChapterRecord[]
    this.currentChapterRecord = null;
    this.puzzleFailures = 0;
    this.itemExaminedCount = 0;
    this.notesReadCount = 0;
    this.keyChoices = [];         // FChoiceRecord[]
    this.events = [];             // 所有事件的扁平日志

    this.sessionStartTime = performance.now();
  }

  _genId() { return 'SESS_' + Math.random().toString(36).slice(2, 10); }
  _ts() { return Date.now(); }
  _t() { return (performance.now() - this.sessionStartTime) / 1000; }

  _pushEvent(type, data = {}) {
    this.events.push({ type, time: this._t(), ts: this._ts(), data });
  }

  // ============== 事件接口 ==============

  recordSessionStart() {
    this.startTime = this._ts();
    this._pushEvent('SessionStart', { sessionId: this.sessionId });
  }

  recordSessionEnd() {
    this.endTime = this._ts();
    this.totalPlaySeconds = this.getTotalPlayTime();
    this._pushEvent('SessionEnd', { totalSeconds: this.totalPlaySeconds });
  }

  recordLevelExit() {
    this._pushEvent('LevelExit', {
      totalPlaySeconds: this.getTotalPlayTime(),
      itemsExamined: this.itemExaminedCount,
      notesRead: this.notesReadCount,
    });
  }

  recordChapterStart(chapterId) {
    this.currentChapterRecord = {
      chapterId,
      startTime: this._t(),
      completionSeconds: null,
      completed: false,
      itemsCollected: [],
      notesRead: [],
      puzzleAttempts: {},
      puzzlesSolved: [],
      doorsOpened: [],
      failCount: 0,
    };
    this.chaptersPlayed.push(this.currentChapterRecord);
    this._pushEvent('ChapterStart', { chapterId });
  }

  recordChapterComplete(chapterId, duration, objectives) {
    const rec = this.chaptersPlayed.find(c => c.chapterId === chapterId);
    if (rec) {
      rec.completed = true;
      rec.completionSeconds = duration;
    }
    this._pushEvent('ChapterComplete', {
      chapterId, duration,
      objectiveCount: objectives.length,
      completedObjectiveCount: objectives.filter(o => o.bIsCompleted).length,
    });
  }

  recordItemExamine(itemId) {
    this.itemExaminedCount++;
    if (this.currentChapterRecord &&
        !this.currentChapterRecord.itemsCollected.includes(itemId)) {
      // 注意: collected 单独记录
    }
    this._pushEvent('ItemExamine', { itemId });
  }

  recordItemCollected(itemId) {
    if (this.currentChapterRecord &&
        !this.currentChapterRecord.itemsCollected.includes(itemId)) {
      this.currentChapterRecord.itemsCollected.push(itemId);
    }
    this._pushEvent('ItemCollected', { itemId });
  }

  recordNoteCollected(noteId) {
    this.notesReadCount++;
    if (this.currentChapterRecord &&
        !this.currentChapterRecord.notesRead.includes(noteId)) {
      this.currentChapterRecord.notesRead.push(noteId);
    }
    this._pushEvent('NoteCollected', { noteId });
  }

  recordPuzzleAttempt(puzzleId, input, attemptNo) {
    if (this.currentChapterRecord) {
      this.currentChapterRecord.puzzleAttempts[puzzleId] = attemptNo;
    }
    this._pushEvent('PuzzleAttempt', { puzzleId, input: [...input], attemptNo });
  }

  recordPuzzleFailed(puzzleId, attemptNo) {
    this.puzzleFailures++;
    if (this.currentChapterRecord) this.currentChapterRecord.failCount++;
    this._pushEvent('PuzzleFailed', { puzzleId, attemptNo });
  }

  recordPuzzleSolved(puzzleId, attempts) {
    if (this.currentChapterRecord &&
        !this.currentChapterRecord.puzzlesSolved.includes(puzzleId)) {
      this.currentChapterRecord.puzzlesSolved.push(puzzleId);
    }
    this._pushEvent('PuzzleSolved', { puzzleId, attempts });
  }

  recordDoorOpened(doorId) {
    if (this.currentChapterRecord &&
        !this.currentChapterRecord.doorsOpened.includes(doorId)) {
      this.currentChapterRecord.doorsOpened.push(doorId);
    }
    this._pushEvent('DoorOpened', { doorId });
  }

  recordSaveLoad(slotIndex, isLoad) {
    this._pushEvent(isLoad ? 'SaveLoad' : 'SaveCreate',
      { slotIndex });
  }

  recordChoiceMade(choiceId, choiceIndex, desc) {
    this.keyChoices.push({
      choiceId, choiceIndex, desc,
      timestamp: this._t(),
    });
    this._pushEvent('KeyChoice', { choiceId, choiceIndex, desc });
  }

  // ============== 查询接口 ==============

  getTotalPlayTime() {
    return (performance.now() - this.sessionStartTime) / 1000;
  }

  formatPlayTime(secs = null) {
    const s = Math.floor(secs ?? this.getTotalPlayTime());
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  // ============== 导出 ==============

  exportToJSON() {
    return JSON.stringify({
      sessionId: this.sessionId,
      startTime: new Date(this.startTime).toISOString(),
      endTime: this.endTime ? new Date(this.endTime).toISOString() : null,
      totalPlaySeconds: this.getTotalPlayTime(),
      puzzleFailures: this.puzzleFailures,
      itemExaminedCount: this.itemExaminedCount,
      notesReadCount: this.notesReadCount,
      chaptersPlayed: this.chaptersPlayed,
      keyChoices: this.keyChoices,
      eventCount: this.events.length,
      events: this.events.slice(-500), // 最近500条
    }, null, 2);
  }

  downloadJSON() {
    const json = this.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry_${this.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 用于存档序列化
  serialize() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      totalPlaySeconds: this.getTotalPlayTime(),
      puzzleFailures: this.puzzleFailures,
      itemExaminedCount: this.itemExaminedCount,
      notesReadCount: this.notesReadCount,
      chaptersPlayed: this.chaptersPlayed,
      keyChoices: this.keyChoices,
    };
  }

  deserialize(data) {
    if (!data) return;
    Object.assign(this, data);
    this.sessionStartTime = performance.now() - (data.totalPlaySeconds || 0) * 1000;
  }
}
