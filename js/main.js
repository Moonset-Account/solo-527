// ========================================================
// 游戏主逻辑 - Game 类 + 启动入口
// ========================================================
import { AudioManager } from './audio.js';
import { TelemetryManager } from './telemetry.js';
import { SaveManager } from './save.js';
import { InputManager } from './input.js';
import { Renderer } from './renderer.js';
import { UIManager } from './ui.js';
import { LEVELS, CHAPTERS, ITEMS, NOTES, PUZZLES } from './gameData.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.audio = new AudioManager();
    this.telemetry = new TelemetryManager();
    this.input = new InputManager();
    this.renderer = new Renderer(this.canvas);
    this.save = null; // 稍后初始化
    this.ui = null;   // 稍后初始化

    // 状态
    this.state = this._createState();

    // 关卡
    this.levelId = null;
    this.chapterId = null;
    this.chapterStartTime = 0;
    this.currentChapterData = null;

    // 玩家
    this.player = {
      pos: { x: 0, y: 0 },
      yaw: 0,  // 朝向 (弧度)
      pitch: 0,
      moveSpeed: 4.5,
      headBob: 0,
      lastStep: 0,
    };

    // 交互
    this.interactables = {
      list: [],
      current: null,
    };

    this.mouseSensitivity = 1.0;

    // 自动保存
    this._autoSaveTimer = 0;
    this._autoSaveInterval = 5 * 60 * 1000;
    this._lastFrame = performance.now();

    // 章节
    this._chapterCompletedHandled = false;
  }

  _createState() {
    return {
      inGame: false,
      collectedItems: new Set(),
      readNotes: new Set(),
      solvedPuzzles: new Set(),
      openedDoors: new Set(),
      completedObjectives: new Set(),
      unlockedChapters: new Set([1]),
      visitedRooms: new Set(),
    };
  }

  // ========== 初始化 ==========
  async init() {
    this.save = new SaveManager(this);
    this.ui = new UIManager(this);
    // 应用设置
    const s = this.save.getSettings();
    this.settings = s;
    this.ui._settingsData = s;
    this.ui.applySettingsLive();
    this.ui.bindSettingsUI();
    this._bindGlobalEvents();
    this.telemetry.recordSessionStart();
    this._autoSaveInterval = (s.gameplay.autosave || 5) * 60 * 1000;
  }

  // ========== 全局事件绑定 ==========
  _bindGlobalEvents() {
    // 主菜单按钮
    document.getElementById('btn-new-game').onclick = () => this.startNewGame();
    document.getElementById('btn-continue').onclick = () => this.continueGame();
    document.getElementById('btn-level-select').onclick = () => this.openLevelSelect();
    document.getElementById('btn-settings').onclick = () => this.ui.openSettingsMenu?.() || (this.ui.showMenu('settingsMenu'), null);
    document.getElementById('btn-telemetry-export').onclick = () => this.exportTelemetry();

    // 设置菜单返回
    document.getElementById('btn-settings-back').onclick = () => {
      this.ui.showMenu(this.state.inGame ? 'pauseMenu' : 'mainMenu');
    };

    // 关卡选择返回
    document.getElementById('btn-level-back').onclick = () => this.ui.showMenu('mainMenu');

    // 暂停菜单
    document.getElementById('btn-resume').onclick = () => this.resumeGame();
    document.getElementById('btn-save-game').onclick = () => this.ui.openSaveMenu('save');
    document.getElementById('btn-load-game').onclick = () => this.ui.openSaveMenu('load');
    document.getElementById('btn-pause-settings').onclick = () => this.ui.showMenu('settingsMenu');
    document.getElementById('btn-return-menu').onclick = () => this.returnToMenu();

    // 存档菜单
    document.getElementById('btn-save-confirm').onclick = () => this.ui.confirmSaveAction();
    document.getElementById('btn-save-delete').onclick = () => this.ui.deleteSelectedSlot();
    document.getElementById('btn-save-back').onclick = () => this.ui.closeSaveMenu();

    // 笔记本
    document.getElementById('btn-notebook-close').onclick = () => this.ui.closeNotebook();
    document.getElementById('note-prev').onclick = () => this.ui.flipPage(-1);
    document.getElementById('note-next').onclick = () => this.ui.flipPage(1);
    document.querySelectorAll('.note-tab').forEach(t => {
      t.addEventListener('click', () => this.ui.switchNoteTab(t.dataset.noteTab));
    });

    // 锁谜题
    document.querySelectorAll('.num-btn').forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.digit !== undefined) this.ui.puzzleInputDigit(parseInt(b.dataset.digit));
      });
    });
    document.getElementById('btn-lock-clear').onclick = () => this.ui.puzzleClear();
    document.getElementById('btn-lock-confirm').onclick = () => {}; // (数字自动在输入满时校验)
    document.getElementById('btn-lock-close').onclick = () => this.ui.closePuzzle();

    // 物品检查
    document.getElementById('btn-examine-pickup').onclick = () => this.ui.pickupExamineItem();
    document.getElementById('btn-examine-close').onclick = () => this.ui.closeExamine();

    // 检查物品: 拖动旋转
    const examineScene = document.getElementById('examine-scene');
    let dragging = false, lastX = 0, lastY = 0;
    examineScene.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mouseup', () => dragging = false);
    window.addEventListener('mousemove', (e) => {
      if (dragging && this.ui.currentMode === 'examine') {
        this.ui.rotateExamine(e.clientX - lastX, e.clientY - lastY);
        lastX = e.clientX; lastY = e.clientY;
      }
    });

    // 章节结算
    document.getElementById('btn-next-chapter').onclick = () => this.goNextChapter();
    document.getElementById('btn-replay-chapter').onclick = () => this.replayChapter();
    document.getElementById('btn-complete-menu').onclick = () => this.returnToMenu();

    // 输入事件
    this.input.on('interact', () => this._onInteract());
    this.input.on('notebook', () => this._onToggleNotebook());
    this.input.on('inventory', () => { this._onToggleNotebook('inventory'); });
    this.input.on('esc', () => this._onEscape());
    this.input.on('digit', (d) => {
      if (this.ui.currentMode === 'puzzle') this.ui.puzzleInputDigit(d);
    });
    this.input.on('rightclick', () => {
      if (this.ui.currentMode === 'puzzle') this.ui.closePuzzle();
    });

    // 开场点击初始化音频
    document.getElementById('start-mask').addEventListener('click', () => this._onStartClicked(), { once: true });
  }

  _onStartClicked() {
    this.audio.init();
    document.getElementById('start-mask').classList.add('hidden');
    this.ui._playClick();
  }

  // ========== 新游戏 / 继续 / 关卡选择 ==========
  async startNewGame() {
    if (!this.audio.initialized) this.audio.init();
    this.state = this._createState();
    this.telemetry = new TelemetryManager();
    this.telemetry.recordSessionStart();
    await this.ui.showLoading('打开旧公寓大门...', '提示: WASD 移动, E 交互');
    this.startChapter(0);
  }

  async continueGame() {
    if (!this.audio.initialized) this.audio.init();
    // 找最新存档
    const slots = this.save.getSlots().filter(Boolean);
    if (slots.length === 0) {
      this.ui.toast('没有可用的存档', 'warning');
      return this.startNewGame();
    }
    let latest = slots[0], latestIdx = 0;
    this.save.getSlots().forEach((s, i) => { if (s && s.saveTime > latest.saveTime) { latest = s; latestIdx = i; } });
    await this.ui.showLoading('读取存档...', '提示: N 键打开笔记本');
    const result = this.save.loadGame(latestIdx);
    this.startLevel(result.levelId, result.chapterId, result.playerPos);
  }

  openLevelSelect() {
    const progressMap = {};
    CHAPTERS.forEach(c => { progressMap[c.id] = this.save.getChapterProgress(c.id); });
    this.ui.renderLevelSelect(this.state.unlockedChapters, progressMap);
    this.ui.showMenu('levelSelect');
    this.ui._playOpen();
  }

  // ========== 章节 / 关卡 ==========
  async startChapter(index) {
    const chapter = CHAPTERS[index];
    if (!chapter) return;
    if (!this.state.unlockedChapters.has(chapter.id)) {
      this.ui.toast('此章节尚未解锁', 'warning');
      return;
    }
    this.currentChapterData = chapter;
    this.chapterId = chapter.id;
    this._chapterCompletedHandled = false;
    this.chapterStartTime = performance.now();
    this.telemetry.recordChapterStart(chapter.id);
    this.ui.dom.curChapterNum.textContent = chapter.id;

    await this.ui.showLoading(
      `进入第 ${chapter.id} 章...`,
      ['提示: 检查每样物品, 背面或许有文字',
       '提示: 笔记本里会整理所有线索',
       '提示: 谜题尝试过多会临时锁定'][index % 3]);

    this.state.inGame = true;
    // 重置目标
    this.state.completedObjectives = new Set(
      [...this.state.completedObjectives].filter(id => {
        // 保留跨章节的 (物品/笔记)
        return false;
      })
    );
    this.ui.renderObjectives(chapter.objectives, this.state.completedObjectives);
    // 环境音
    this.audio.setAmbient(chapter.ambientSound, 1.2);
    // 渲染背景色
    document.body.style.background = `linear-gradient(180deg, ${chapter.bgGradient[0]}, ${chapter.bgGradient[1]})`;

    this.startLevel(chapter.levelId, chapter.id);
    // HUD
    this.ui.showMenu(null);
    this.ui.showHUD(true);
    // 章节标题
    this.ui.showChapterTitle(chapter.subtitle, chapter.title);
    // 章节起始旁白
    const narrations = [
      '建国南路二段37号5楼。推开门的那一刻，空气里是灰尘和时间的味道。',
      '走廊尽头的卧室门虚掩着。据说林女士最后几年，很少走出那扇门。',
      '楼梯向下延伸，地下室的空气潮湿而冰冷。真相在下面等着。',
    ];
    setTimeout(() => this.ui.showNarration(narrations[index] || ''), 4200);

    this.ui.currentMode = 'game';
  }

  startLevel(levelId, chapterId, playerPos = null) {
    this.levelId = levelId;
    if (chapterId) this.chapterId = chapterId;
    const level = LEVELS[levelId];
    if (!level) return;
    this.player.pos = playerPos ? { ...playerPos } : { x: level.spawn.x + 0.5, y: level.spawn.y + 0.5 };
    if (playerPos && playerPos.yaw !== undefined) this.player.yaw = playerPos.yaw;
    this._buildInteractables();
  }

  goNextChapter() {
    const idx = CHAPTERS.findIndex(c => c.id === this.chapterId);
    if (idx < 0 || idx >= CHAPTERS.length - 1) {
      this.ui.toast('你已完成所有章节', 'success');
      return this.returnToMenu();
    }
    this.ui.closeChapterComplete();
    this.startChapter(idx + 1);
  }

  replayChapter() {
    const idx = CHAPTERS.findIndex(c => c.id === this.chapterId);
    this.ui.closeChapterComplete();
    if (idx >= 0) this.startChapter(idx);
  }

  resumeGame() {
    this.ui.showMenu(null);
    this.ui.showHUD(true);
    this.ui.currentMode = 'game';
  }

  async returnToMenu() {
    if (this.state.inGame) {
      // 自动保存
      this.save.saveGame(this.save.autoSlotIndex(), true);
      this.telemetry.recordLevelExit();
    }
    this.audio.fadeOutAmbient(1.0);
    this.state.inGame = false;
    this.ui.closeChapterComplete();
    this.ui.showHUD(false);
    this.ui.showMenu('mainMenu');
    this.ui.currentMode = 'menu';
  }

  // ========== 暂停 ==========
  _onEscape() {
    if (!this.state.inGame) return;
    if (this.ui.currentMode === 'examine') return this.ui.closeExamine();
    if (this.ui.currentMode === 'puzzle') return this.ui.closePuzzle();
    if (this.ui.currentMode === 'ui') {
      // 关闭所有菜单
      this.ui.notebook.classList.contains('hidden') || this.ui.closeNotebook();
      this.ui.pauseMenu.classList.contains('hidden') || this.resumeGame();
      this.ui.saveMenu.classList.contains('hidden') || this.ui.closeSaveMenu();
      this.ui.settingsMenu.classList.contains('hidden') || this.ui.showMenu('pauseMenu');
      return;
    }
    if (this.ui.currentMode === 'game') {
      this.ui.showMenu('pauseMenu');
      this.ui.currentMode = 'ui';
      this.ui._playOpen();
    }
  }

  _onToggleNotebook(tab = 'notes') {
    if (!this.state.inGame) return;
    if (this.ui.currentMode === 'ui' &&
        !this.ui.dom.notebook.classList.contains('hidden')) {
      return this.ui.closeNotebook();
    }
    if (this.ui.currentMode === 'game') {
      this.ui.openNotebook(tab);
    } else if (this.ui.currentMode === 'examine' || this.ui.currentMode === 'puzzle') {
      // 不打开
    }
  }

  // ========== 交互系统 ==========
  _buildInteractables() {
    const level = LEVELS[this.levelId];
    const list = [];
    // 物品
    (level.items || []).forEach(item => {
      list.push({
        type: item.isPuzzle ? 'puzzle' : 'item',
        id: item.itemId,
        data: item.isPuzzle ? PUZZLES[item.itemId] : ITEMS[item.itemId],
        levelItem: item,
        x: item.x + 0.5, y: item.y + 0.5,
      });
    });
    // 门
    (level.doors || []).forEach(door => {
      list.push({
        type: 'door',
        id: door.id,
        data: door,
        door,
        x: door.x + (door.w || 1) / 2,
        y: door.y + (door.h || 1) / 2,
      });
    });
    this.interactables.list = list;
  }

  _findNearestInteractable() {
    const R = 1.8; // 交互半径 (tile)
    let nearest = null, minD = R;
    for (const it of this.interactables.list) {
      // 隐藏物品需要条件
      if (it.levelItem?.hidden && !this._itemUnlocked(it)) continue;
      // 已拾取/已完成的谜题不交互(但谜题可再检查)
      if (it.type === 'item' && this.state.collectedItems.has(it.id)) continue;
      const d = Math.hypot(it.x - this.player.pos.x, it.y - this.player.pos.y);
      if (d < minD) { minD = d; nearest = it; }
    }
    return nearest;
  }

  _itemUnlocked(it) {
    // ITEM_006 钥匙: 检查过 ITEM_003 照片后显示
    if (it.id === 'ITEM_006') return this.state.collectedItems.has('ITEM_003') ||
      this.state.visitedRooms.has('ROOM_LIVING');
    // ITEM_104: 检查过衣柜(通过走过就好)
    if (it.id === 'ITEM_104') return this.state.visitedRooms.has('ROOM_MASTER');
    // ITEM_105: 解开PUZZLE_002后发
    if (it.id === 'ITEM_105') return this.state.solvedPuzzles.has('PUZZLE_002');
    // NOTE_103: 解 PUZZLE_001 才发
    if (it.id === 'NOTE_103') return false; // 通过奖励链给
    // NOTE_201: 解 PUZZLE_003
    if (it.id === 'NOTE_201') return this.state.solvedPuzzles.has('PUZZLE_003');
    return true;
  }

  _updateInteract() {
    const near = this._findNearestInteractable();
    this.interactables.current = near;
    if (near) {
      this.ui.setInteractPrompt(this._promptFor(near), true);
    } else {
      this.ui.setInteractPrompt('', false);
    }
  }

  _promptFor(it) {
    switch (it.type) {
      case 'item':
        const d = it.data || {};
        if (d.bIsNote) return `按 E 阅读：${d.displayName}`;
        if (d.bIsPickable) return `按 E 检查并拾取：${d.displayName}`;
        return `按 E 检查：${d.displayName}`;
      case 'puzzle':
        if (this.state.solvedPuzzles.has(it.id)) return `[已解开] ${it.data.displayName}`;
        if (it.data.requiresItem && !this.state.collectedItems.has(it.data.requiresItem)) {
          return '需要钥匙...';
        }
        return `按 E 尝试：${it.data.displayName}`;
      case 'door':
        const dr = it.door;
        const unlocked = !dr.locked || this.state.collectedItems.has(dr.keyItem) ||
          this.state.openedDoors.has(dr.id);
        if (dr.isEnding) return unlocked ? `按 E 走出后巷 (结局) →` : '后巷门紧锁...';
        return unlocked ? `按 E 打开：${dr.name}` : `🔒 需要钥匙`;
    }
    return '按 E 交互';
  }

  _onInteract() {
    if (this.ui.currentMode !== 'game') return;
    const it = this.interactables.current;
    if (!it) return;

    switch (it.type) {
      case 'item':
        this.ui.audio.playSFX('UI_Interact');
        this.ui.openExamine(it.data);
        // 检查物品时顺便记为已交互 (用于隐藏物品显示)
        break;
      case 'puzzle':
        if (this.state.solvedPuzzles.has(it.id)) {
          this.ui.toast('这个谜题已经解开了', 'info');
          return;
        }
        if (it.data.requiresItem && !this.state.collectedItems.has(it.data.requiresItem)) {
          this.ui.toast('需要先找到钥匙', 'warning');
          return;
        }
        this.ui.audio.playSFX('Puzzle_Lock');
        this.ui.openPuzzle(it.data);
        break;
      case 'door':
        const dr = it.door;
        const unlocked = !dr.locked || this.state.collectedItems.has(dr.keyItem) ||
          this.state.openedDoors.has(dr.id);
        if (!unlocked) {
          this.ui.audio.playSFX('Puzzle_Lock');
          this.ui.toast('门紧锁着...需要钥匙', 'warning');
          this.renderer.shake(3, 0.15);
          return;
        }
        // 开门
        this.ui.audio.playSFX('Env_DoorCreak');
        setTimeout(() => this.ui.audio.playSFX('Env_DoorShut'), 500);
        this.telemetry.recordDoorOpened(dr.id);
        this.state.openedDoors.add(dr.id);
        // 消耗钥匙
        if (dr.locked && dr.keyItem && !this.state.openedDoors.has(dr.id)) {
          // 钥匙保留 (可重复开门)
        }
        // 结局
        if (dr.isEnding) {
          this.checkObjective('EnterRoom', dr.toRoom);
          this._triggerEnding();
          return;
        }
        // 进入新关卡
        if (dr.toLevel && dr.toLevel !== this.levelId) {
          this.telemetry.recordLevelExit();
          this.startLevel(dr.toLevel, this.chapterId, dr.toSpawn);
          this.ui.toast('进入 ' + (LEVELS[dr.toLevel] ? '' : ''), 'info');
          if (dr.toRoom) {
            this.checkObjective('EnterRoom', dr.toRoom);
            this.state.visitedRooms.add(dr.toRoom);
          }
        } else {
          this.checkObjective('EnterRoom', dr.toRoom);
          if (dr.toRoom) this.state.visitedRooms.add(dr.toRoom);
        }
        break;
    }
  }

  // ========== 物品直接给予 (谜题奖励链) ==========
  giveItem(itemId) {
    const data = ITEMS[itemId];
    if (!data) return;
    if (this.state.collectedItems.has(itemId)) return;
    this.state.collectedItems.add(itemId);
    this.telemetry.recordItemCollected(itemId);
    this.checkObjective('CollectItem', itemId);
    this.checkObjective('CollectCount', this.state.collectedItems.size);
    if (data.bIsNote && data.noteId) {
      this.state.readNotes.add(data.noteId);
      this.telemetry.recordNoteCollected(data.noteId);
      this.checkObjective('ReadNote', data.noteId);
      // 打开笔记查看
      setTimeout(() => {
        this.ui._playOpen();
        this.ui.toast(`获得笔记: ${data.displayName}`, 'success');
        this.ui.openNotebook('notes');
        const nd = NOTES[data.noteId];
        if (nd) {
          setTimeout(() => {
            this.ui._noteListData = [nd];
            this.ui.showNoteContent(nd);
          }, 400);
        }
      }, 1500);
    } else {
      this.ui.toast(`获得物品: ${data.displayName}`, 'success');
    }
  }

  // ========== 目标检查 ==========
  checkObjective(type, value) {
    if (!this.currentChapterData) return;
    const objs = this.currentChapterData.objectives;
    let anyDone = false;
    objs.forEach(obj => {
      if (this.state.completedObjectives.has(obj.id)) return;
      let done = false;
      if (obj.type === type) {
        if (obj.type === 'CollectCount') done = value >= obj.value;
        else done = obj.value === value;
      }
      if (done) {
        this.state.completedObjectives.add(obj.id);
        this.ui.markObjectiveComplete(obj.id);
        this.ui.audio.playSFX('UI_ObjectiveComplete');
        anyDone = true;
      }
    });
    if (anyDone) {
      // 章节完成检查
      this._checkChapterComplete();
    }
  }

  _checkChapterComplete() {
    if (this._chapterCompletedHandled) return;
    if (!this.currentChapterData) return;
    const objs = this.currentChapterData.objectives;
    const req = objs.filter(o => o.required);
    const all = req.every(o => this.state.completedObjectives.has(o.id));
    if (!all) return;
    this._chapterCompletedHandled = true;
    const ch = this.currentChapterData;
    const duration = (performance.now() - this.chapterStartTime) / 1000;
    this.telemetry.recordChapterComplete(ch.id, duration, objs);
    // 解锁下一章
    const next = CHAPTERS.find(c => c.id === ch.id + 1);
    if (next) {
      this.state.unlockedChapters.add(next.id);
    }
    // 统计
    const chItemIds = (LEVELS[ch.levelId]?.items || [])
      .filter(i => !i.isPuzzle).map(i => i.itemId);
    const chNoteIds = chItemIds.filter(id => ITEMS[id]?.bIsNote);
    const chPuzzleIds = (LEVELS[ch.levelId]?.items || [])
      .filter(i => i.isPuzzle).map(i => i.itemId);
    const itemsDone = chItemIds.filter(id => this.state.collectedItems.has(id)).length;
    const notesDone = chNoteIds.filter(id => this.state.readNotes.has(ITEMS[id]?.noteId)).length;
    const puzzlesDone = chPuzzleIds.filter(id => this.state.solvedPuzzles.has(id)).length;
    const failCount = this.telemetry.currentChapterRecord?.failCount || 0;
    const totalObj = objs.length;
    const doneObj = objs.filter(o => this.state.completedObjectives.has(o.id)).length;
    const completion = Math.round((doneObj / totalObj) * 100);

    const stats = {
      duration: this.telemetry.formatPlayTime(duration),
      itemsDone, itemsTotal: chItemIds.length,
      notesDone, notesTotal: chNoteIds.length,
      puzzlesDone, puzzlesTotal: chPuzzleIds.length,
      failCount, completion,
    };
    // 自动存档
    this.save.saveGame(this.save.autoSlotIndex(), true);
    setTimeout(() => {
      this.ui.showHUD(false);
      this.ui.openChapterComplete(ch, stats, next ? next.title : null);
    }, 1500);
  }

  _triggerEnding() {
    // 触发结局流程: 显示结局旁白 -> 章节完成
    this.ui.showHUD(false);
    const ending = `推开门的瞬间，雨后清新的空气扑面而来。

后巷的路灯昏黄，照着湿漉漉的石板路。
林女士终究是没有等到她回来。
但画的背面写着——"我没有迷路"。

也许，在另一个世界里，
她们终于一起去了那个画着粉色太阳的海边。

建国南路二段37号5楼。
整理完成。`;
    this.ui.showNarration(ending, 60).then(() => {
      this._checkChapterComplete();
    });
  }

  // ========== 导出试玩数据 ==========
  exportTelemetry() {
    this.telemetry.downloadJSON();
    this.ui.toast('试玩数据已下载', 'success');
  }

  // ========== 主循环 ==========
  start() {
    requestAnimationFrame(() => this._loop());
  }

  _loop() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this._lastFrame) / 1000);
    this._lastFrame = now;

    if (this.state.inGame && this.ui.currentMode === 'game') {
      this._updatePlayer(dt);
      this._updateRoomTriggers();
      this._updateInteract();
      this._updateAutoSave(dt);
    }
    this.renderer.update(dt);

    if (this.state.inGame && this.levelId) {
      this.renderer.render(this.levelId, this.player, this.state, this.interactables);
    } else {
      // 主菜单渲染: 简单的背景动画
      this._renderMenuBackground(now);
    }

    requestAnimationFrame(() => this._loop());
  }

  _updatePlayer(dt) {
    const mv = this.input.getMoveVector();
    if (mv.x !== 0 || mv.y !== 0) {
      // 朝向
      const targetYaw = Math.atan2(mv.x, -mv.y);
      // 平滑转
      let dy = targetYaw - this.player.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this.player.yaw += dy * Math.min(1, dt * 12);

      // 移动 (简单, 不考虑朝向)
      const nx = this.player.pos.x + mv.x * this.player.moveSpeed * dt;
      const ny = this.player.pos.y + mv.y * this.player.moveSpeed * dt;
      if (!this.renderer.isWall(this.levelId, nx, this.player.pos.y)) this.player.pos.x = nx;
      if (!this.renderer.isWall(this.levelId, this.player.pos.x, ny)) this.player.pos.y = ny;

      // 头部晃动
      this.player.headBob += dt * 10;
      // 脚步声
      this.player.lastStep += dt;
      if (this.player.lastStep > 0.45) {
        this.audio.playSFX(Math.random() < 0.5 ? 'Env_Footstep_Wood' : 'Env_Footstep_Wood2', 0.4);
        if (Math.random() < 0.12) this.audio.playSFX('Env_Floor_Squeak', 0.3);
        this.player.lastStep = 0;
      }
    } else {
      this.player.headBob *= 0.9;
    }
  }

  _updateRoomTriggers() {
    const level = LEVELS[this.levelId];
    if (!level) return;
    (level.roomTriggers || []).forEach(rt => {
      const r = rt.rect;
      if (this.player.pos.x >= r[0] && this.player.pos.x < r[0] + r[2] &&
          this.player.pos.y >= r[1] && this.player.pos.y < r[1] + r[3]) {
        if (!this.state.visitedRooms.has(rt.id)) {
          this.state.visitedRooms.add(rt.id);
          this.checkObjective('EnterRoom', rt.id);
          // 微刺激
          this._narrativeTrigger(rt.id);
        }
      }
    });
  }

  _narrativeTrigger(roomId) {
    const narrative = {
      ROOM_ENTRANCE: '玄关的鞋架上，只摆着一双拖鞋。',
      ROOM_KITCHEN:  '冰箱嗡嗡作响，里面空空如也。',
      ROOM_LIVING:   '窗帘后面，是黄昏时分的城市。',
      ROOM_DINING:   '餐桌上的灰尘很厚...很久没人吃饭了。',
      ROOM_HALLWAY:  '走廊尽头的灯，一闪一闪。',
      ROOM_MASTER:   '主卧室里，床单平整，像没人睡过。',
      ROOM_DAUGHTER: '粉色的墙纸，卡通贴纸...这里是小岚的房间。',
      ROOM_BATHROOM: '药柜里的药已经过期很久。',
      ROOM_STAIRS:   '向下的楼梯，空气突然变冷。',
      ROOM_BASEMENT: '地下室深处，似乎有滴水声。',
      ROOM_DEEP:     '那只旧箱子...积着厚厚的灰。',
      ROOM_STORAGE:  '纸箱上写着「小岚的东西 · 1998」。',
    };
    const text = narrative[roomId];
    if (text) setTimeout(() => this.ui.showNarration(text, 45), 500);
    // Level 1 特定刺激
    if (roomId === 'ROOM_LIVING' && this.chapterId === 1) {
      setTimeout(() => this.audio.playNarrativeStinger('Env_Floor_Squeak', -0.7, 3.0), 3500);
    }
    if (roomId === 'ROOM_MASTER' && this.chapterId === 2) {
      setTimeout(() => this.audio.playSFX('Env_Window_Rattle', 0.5), 2500);
    }
    if (roomId === 'ROOM_BASEMENT') {
      setTimeout(() => this.audio.playSFX('Env_Drip', 0.4), 1500);
      setInterval(() => {
        if (this.levelId === 'Basement') this.audio.playSFX('Env_Drip', 0.3 + Math.random() * 0.3);
      }, 4500);
    }
  }

  _updateAutoSave(dt) {
    this._autoSaveTimer += dt * 1000;
    if (this._autoSaveTimer >= this._autoSaveInterval) {
      this._autoSaveTimer = 0;
      this.save.saveGame(this.save.autoSlotIndex(), true);
      this.ui.toast('已自动保存', 'info', 1500);
    }
  }

  // 主菜单: 静态背景
  _renderMenuBackground(t) {
    const ctx = this.renderer.ctx;
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 0, this.renderer.W, this.renderer.H);
    // 公寓剪影
    ctx.fillStyle = '#141008';
    for (let x = 0; x < 20; x++) {
      const h = 200 + Math.sin(x * 1.3) * 50;
      ctx.fillRect(x * 70, this.renderer.H - h, 60, h);
      // 窗户
      for (let y = 0; y < 5; y++) {
        if (Math.sin(x * 7 + y * 3 + t * 0.0003) > 0.4) {
          ctx.fillStyle = 'rgba(232, 200, 122, 0.35)';
          ctx.fillRect(x * 70 + 10, this.renderer.H - h + 30 + y * 40, 14, 18);
          ctx.fillStyle = '#141008';
        }
      }
    }
    // 雨
    ctx.strokeStyle = 'rgba(200,220,240,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const x = (i * 17 + t * 0.08) % this.renderer.W;
      const y = (i * 37 + t * 0.5) % this.renderer.H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 14);
      ctx.stroke();
    }
  }
}

// ========== 启动 ==========
window.addEventListener('DOMContentLoaded', async () => {
  const game = new Game();
  window.__GAME = game;
  await game.init();
  game.start();
  console.log('🎮 旧公寓 · 遗物整理录 — 已启动');
});
