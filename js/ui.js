// ========================================================
// UI 管理器 - 所有 HUD / 菜单 / 弹窗控制
// ========================================================
import { CHAPTERS, ITEMS, NOTES, PUZZLES } from './gameData.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.audio = game.audio;

    // 状态
    this.currentMode = 'menu'; // menu/game/ui/puzzle/examine
    this.currentPuzzle = null;
    this.currentNote = null;
    this.currentExamine = null;
    this.puzzleAttempts = 0;
    this.puzzleInput = [];
    this.examineRotation = { x: 0, y: 0 };

    // DOM 引用
    this._cacheDom();
    // 初始化设置
    this._initSettings();
  }

  _cacheDom() {
    this.$ = (id) => document.getElementById(id);
    this.dom = {
      hud: this.$('hud-layer'),
      mainMenu: this.$('main-menu'),
      levelSelect: this.$('level-select'),
      settingsMenu: this.$('settings-menu'),
      pauseMenu: this.$('pause-menu'),
      saveMenu: this.$('save-menu'),
      notebook: this.$('notebook-menu'),
      lockMenu: this.$('lock-menu'),
      examineMenu: this.$('examine-menu'),
      chapterComplete: this.$('chapter-complete'),
      loading: this.$('loading-screen'),
      startMask: this.$('start-mask'),
      // HUD elements
      interactPrompt: this.$('interact-prompt'),
      interactText: this.$('interact-text'),
      chapterTitleOverlay: this.$('chapter-title-overlay'),
      chapterNumEl: this.$('chapter-number'),
      chapterTitleEl: this.$('chapter-title'),
      objectivesList: this.$('objectives-list'),
      narrationBar: this.$('narration-bar'),
      narrationText: this.$('narration-text'),
      toastContainer: this.$('toast-container'),
      lockCooldown: this.$('lock-cooldown-display'),
      cooldownTime: this.$('cooldown-time'),
      curChapterNum: this.$('cur-chapter-num'),
    };
  }

  // ============== 显示/隐藏 ==============
  showMenu(name) {
    this._hideAllMenus();
    if (name && this.dom[name]) {
      this.dom[name].classList.remove('hidden');
    }
  }

  _hideAllMenus() {
    ['mainMenu','levelSelect','settingsMenu','pauseMenu','saveMenu',
     'notebook','lockMenu','examineMenu','chapterComplete','loading']
      .forEach(k => this.dom[k].classList.add('hidden'));
  }

  showHUD(show) {
    this.dom.hud.classList.toggle('hidden', !show);
  }

  // ============== HUD 交互提示 ==============
  setInteractPrompt(text, show) {
    if (show === false || !text) {
      this.dom.interactPrompt.classList.add('hidden');
    } else {
      this.dom.interactText.textContent = text;
      this.dom.interactPrompt.classList.remove('hidden');
    }
  }

  // ============== 章节标题 ==============
  showChapterTitle(subtitle, title, duration = 4000) {
    this.dom.chapterNumEl.textContent = subtitle;
    this.dom.chapterTitleEl.textContent = title;
    this.dom.chapterTitleOverlay.classList.remove('hidden');
    // CSS 动画控制 fade，到时隐藏
    setTimeout(() => {
      this.dom.chapterTitleOverlay.classList.add('hidden');
    }, duration);
  }

  // ============== 目标列表 ==============
  renderObjectives(objectives, completedSet) {
    const list = this.dom.objectivesList;
    list.innerHTML = '';
    objectives.forEach(obj => {
      const li = document.createElement('li');
      if (completedSet.has(obj.id)) {
        li.classList.add('done');
      }
      li.dataset.id = obj.id;
      li.textContent = obj.desc;
      list.appendChild(li);
    });
  }

  markObjectiveComplete(id) {
    const el = this.dom.objectivesList.querySelector(`[data-id="${id}"]`);
    if (el && !el.classList.contains('done')) {
      el.classList.add('new-completed');
      setTimeout(() => {
        el.classList.remove('new-completed');
        el.classList.add('done');
      }, 1000);
    }
  }

  // ============== 旁白打字机 ==============
  async showNarration(text, speed = 40) {
    if (!this.game.settings.gameplay.subtitles) return;
    this.dom.narrationBar.classList.remove('hidden');
    this.dom.narrationText.textContent = '';
    for (let i = 0; i < text.length; i++) {
      this.dom.narrationText.textContent += text[i];
      if (i % 3 === 0) this.audio.playSFX('UI_Typewriter', 0.5);
      await this._sleep(speed);
    }
    // 停留
    const holdTime = Math.max(3000, text.length * 60);
    await this._sleep(holdTime);
    this.dom.narrationBar.classList.add('hidden');
  }

  // ============== Toast ==============
  toast(message, type = 'info', duration = 3000) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    this.dom.toastContainer.appendChild(el);
    setTimeout(() => el.remove(), duration + 400);
    this.audio.playSFX(type === 'success' ? 'UI_SaveComplete' : type === 'error' ? 'Puzzle_Fail' : 'UI_Hover', 0.7);
  }

  // ============== 关卡选择 ==============
  renderLevelSelect(unlockedSet, progressMap) {
    const grid = this.$('chapters-grid');
    grid.innerHTML = '';
    let selected = -1;

    CHAPTERS.forEach((ch, i) => {
      const unlocked = unlockedSet.has(ch.id);
      const progress = progressMap[ch.id] || { completed: false, completion: 0, bestTime: null };
      const card = document.createElement('div');
      card.className = 'chapter-card' + (unlocked ? '' : ' locked');
      if (!unlocked) {
        card.innerHTML = `
          <div class="lock-overlay">🔒</div>
          <div class="chapter-badge">第 ${ch.id} 章</div>
          <div class="chapter-card-title">${ch.title}</div>
          <div class="chapter-card-desc">${ch.description}</div>
          <div class="chapter-card-preview">🏚️</div>
          <div class="chapter-status">需先完成第 ${ch.id - 1} 章</div>`;
      } else {
        card.innerHTML = `
          <div class="chapter-badge">第 ${ch.id} 章</div>
          <div class="chapter-card-title">${ch.title}</div>
          <div class="chapter-card-desc">${ch.description}</div>
          <div class="chapter-card-preview">${['🛋️','🛏️','📦'][i] || '🏚️'}</div>
          <div class="chapter-progress-bar"><div class="chapter-progress-fill" style="width:${(progress.completion||0)}%"></div></div>
          <div class="chapter-status">${progress.completed ? '✓ 已通关' : '未完成'}${progress.bestTime ? ' · 最佳: ' + progress.bestTime : ''}</div>`;
        card.addEventListener('click', () => {
          document.querySelectorAll('.chapter-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selected = i;
        });
      }
      grid.appendChild(card);
    });

    // 返回按钮已有, 绑定选择开始
    const startBtn = document.createElement('button');
    startBtn.className = 'menu-btn primary';
    startBtn.textContent = '开始所选章节';
    startBtn.style.marginTop = '20px';
    const existingStart = grid.parentElement.querySelector('#btn-start-selected');
    if (existingStart) existingStart.remove();
    startBtn.id = 'btn-start-selected';
    startBtn.onclick = () => {
      if (selected >= 0) {
        this._playClick();
        this.game.startChapter(selected);
      } else {
        this.toast('请先选择一个章节', 'warning');
      }
    };
    grid.parentElement.appendChild(startBtn);
  }

  // ============== 笔记本 & 物品 & 线索 ==============
  openNotebook(tab = 'notes') {
    this.currentMode = 'ui';
    this.showMenu('notebook');
    this.switchNoteTab(tab);
    this.renderNotesList();
    this.renderInventory();
    this.renderClues();
    this._playOpen();
  }

  closeNotebook() {
    this.dom.notebook.classList.add('hidden');
    if (this.game.state.inGame) {
      this.currentMode = 'game';
      this.dom.hud.classList.remove('hidden');
    } else {
      this.showMenu('mainMenu');
    }
    this._playClose();
  }

  switchNoteTab(tab) {
    document.querySelectorAll('.note-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.noteTab === tab));
    document.querySelectorAll('.note-tab-pane').forEach(p =>
      p.classList.toggle('hidden', p.id !== `pane-${tab}`));
    this._playHover();
  }

  renderNotesList() {
    const list = this.$('notes-list');
    list.innerHTML = '';
    const notes = [...this.game.state.readNotes];
    if (notes.length === 0) {
      list.innerHTML = '<div class="note-empty">还没有收集到笔记。<br>仔细搜索每一张纸吧。</div>';
      this.$('note-title').textContent = '—';
      this.$('note-meta').textContent = '—';
      this.$('note-content').textContent = '';
      this.$('note-page-indicator').textContent = '0 / 0';
      return;
    }
    this._noteListData = [];
    notes.forEach(nid => {
      const nd = NOTES[nid];
      if (!nd) return;
      this._noteListData.push(nd);
      const item = document.createElement('div');
      item.className = 'note-item';
      item.innerHTML = `
        <div class="note-item-title">${nd.title}</div>
        <div class="note-item-meta">${nd.author || ''} · ${nd.dateStr || ''}</div>`;
      item.addEventListener('click', () => {
        document.querySelectorAll('.note-item').forEach(n => n.classList.remove('selected'));
        item.classList.add('selected');
        this.showNoteContent(nd);
        this._playClick();
      });
      list.appendChild(item);
    });
    // 自动选第一个
    if (this._noteListData[0]) {
      const first = list.querySelector('.note-item');
      if (first) first.classList.add('selected');
      this.showNoteContent(this._noteListData[0]);
    }
  }

  showNoteContent(noteData) {
    this.currentNote = noteData;
    this._currentNotePage = 0;
    this._renderNotePage();
  }

  _renderNotePage() {
    if (!this.currentNote) return;
    const nd = this.currentNote;
    const pg = this._currentNotePage;
    this.$('note-title').textContent = nd.title;
    this.$('note-meta').textContent =
      (nd.author ? nd.author + ' · ' : '') + (nd.dateStr || '');
    const content = this.$('note-content');
    content.textContent = nd.pages[pg] || '';
    content.className = 'note-content mood-' + (nd.mood || 'neutral');
    this.$('note-page-indicator').textContent = `${pg + 1} / ${nd.pages.length}`;
  }

  flipPage(dir) {
    if (!this.currentNote) return;
    const total = this.currentNote.pages.length;
    this._currentNotePage = (this._currentNotePage + dir + total) % total;
    this._renderNotePage();
    this.audio.playSFX('UI_PageFlip');
  }

  renderInventory() {
    const grid = this.$('inventory-grid');
    grid.innerHTML = '';
    const items = [...this.game.state.collectedItems].filter(id =>
      ITEMS[id] && !ITEMS[id].bIsNote);
    if (items.length === 0) {
      grid.innerHTML = '<div class="inv-empty">背包是空的。<br>在公寓里找到物品后会出现在这里。</div>';
      return;
    }
    items.forEach(iid => {
      const data = ITEMS[iid];
      if (!data) return;
      const item = document.createElement('div');
      item.className = 'inv-item';
      item.innerHTML = `
        <div class="inv-icon">${data.icon || '📦'}</div>
        <div class="inv-name">${data.displayName}</div>`;
      item.title = data.description;
      grid.appendChild(item);
    });
  }

  renderClues() {
    const list = this.$('clues-list');
    list.innerHTML = '';
    const activePuzzles = Object.values(PUZZLES).filter(p =>
      !this.game.state.solvedPuzzles.has(p.id));
    const solvedPuzzles = Object.values(PUZZLES).filter(p =>
      this.game.state.solvedPuzzles.has(p.id));

    let html = '';
    if (solvedPuzzles.length) {
      html += '<h3>✓ 已解开的线索</h3>';
      solvedPuzzles.forEach(p => {
        const related = Object.values(NOTES).find(n => n.relatedPuzzleId === p.id);
        html += `<div class="clue-card solved">
          <span class="clue-status solved">已解开</span>
          <div class="clue-title">${p.displayName}</div>
          <div class="clue-hint">${related ? '线索来源: ' + related.title : ''}</div>
        </div>`;
      });
    }
    if (activePuzzles.length) {
      html += '<h3>◇ 待发现的线索</h3>';
      activePuzzles.forEach(p => {
        const related = Object.values(NOTES).find(n => n.relatedPuzzleId === p.id);
        const relatedLink = related && this.game.state.readNotes.has(related.id);
        html += `<div class="clue-card">
          <span class="clue-status active">调查中</span>
          <div class="clue-title">${p.displayName} (${p.digitCount}位密码)</div>
          <div class="clue-hint">${this.game.settings.gameplay.hints ? p.hintText : '提示已关闭'}</div>
          ${relatedLink ? `<div class="clue-links">关联笔记: <span class="link" data-note="${related.id}">${related.title}</span></div>` : ''}
        </div>`;
      });
    }
    list.innerHTML = html || '<p style="padding:30px;color:#999;font-style:italic;text-align:center">暂无线索。找到锁或谜题后会出现在这里。</p>';

    list.querySelectorAll('.link[data-note]').forEach(link => {
      link.addEventListener('click', () => {
        const nid = link.dataset.note;
        this.switchNoteTab('notes');
        this._jumpToNote(nid);
      });
    });
  }

  _jumpToNote(nid) {
    const items = document.querySelectorAll('.note-item');
    items.forEach((el, i) => {
      const nd = this._noteListData[i];
      if (nd && nd.id === nid) {
        items.forEach(n => n.classList.remove('selected'));
        el.classList.add('selected');
        this.showNoteContent(nd);
      }
    });
  }

  // ============== 锁谜题 UI ==============
  openPuzzle(puzzleData) {
    this.currentMode = 'puzzle';
    this.currentPuzzle = puzzleData;
    this.puzzleInput = [];
    this.puzzleAttempts = 0;
    this.showMenu('lockMenu');

    const container = this.$('lock-menu').querySelector('.lock-container');
    container.classList.remove('shake', 'success-flash');

    this.$('lock-hint').textContent =
      this.game.settings.gameplay.hints ? puzzleData.hintText : '输入密码...';
    this.$('lock-hint').classList.toggle('hint', this.game.settings.gameplay.hints);

    // 渲染 digits
    const digitsEl = this.$('lock-digits');
    digitsEl.innerHTML = '';
    for (let i = 0; i < puzzleData.digitCount; i++) {
      const d = document.createElement('div');
      d.className = 'lock-digit placeholder';
      d.dataset.idx = i;
      d.textContent = '—';
      digitsEl.appendChild(d);
    }
    this._updatePuzzleAttempts();
    this._playOpen();
  }

  puzzleInputDigit(digit) {
    if (!this.currentPuzzle) return;
    if (this.dom.lockCooldown.classList.contains('hidden') === false) return;
    if (this.puzzleInput.length >= this.currentPuzzle.digitCount) return;

    this.puzzleInput.push(digit);
    const idx = this.puzzleInput.length - 1;
    const digitEls = this.$('lock-digits').querySelectorAll('.lock-digit');
    if (digitEls[idx]) {
      digitEls[idx].textContent = digit;
      digitEls[idx].classList.remove('placeholder');
      digitEls[idx].classList.add('filled');
    }
    this.audio.playSFX('Puzzle_DigitClick');

    if (this.puzzleInput.length === this.currentPuzzle.digitCount) {
      setTimeout(() => this._checkPuzzle(), 250);
    }
  }

  puzzleClear() {
    this.puzzleInput = [];
    this.$('lock-digits').querySelectorAll('.lock-digit').forEach(d => {
      d.textContent = '—';
      d.classList.add('placeholder');
      d.classList.remove('filled');
    });
    this.audio.playSFX('Puzzle_Clear');
  }

  _checkPuzzle() {
    if (!this.currentPuzzle) return;
    const p = this.currentPuzzle;
    this.puzzleAttempts++;
    this.game.telemetry.recordPuzzleAttempt(p.id, this.puzzleInput, this.puzzleAttempts);
    const correct = this.puzzleInput.every((v, i) => v === p.password[i]);

    const container = this.$('lock-menu').querySelector('.lock-container');

    if (correct) {
      container.classList.add('success-flash');
      this.audio.playSFX('Puzzle_Solve');
      this.game.renderer.flash('#8ab58a', 0.25, 0.4);
      this.game.state.solvedPuzzles.add(p.id);
      this.game.telemetry.recordPuzzleSolved(p.id, this.puzzleAttempts);
      this.toast(`密码正确!`, 'success');

      // 奖励链
      setTimeout(() => this.showNarration(p.onSolveText), 300);
      if (p.rewardItemId) {
        setTimeout(() => {
          this.game.giveItem(p.rewardItemId);
          if (ITEMS[p.rewardItemId]?.bIsNote) {
            // 笔记 - 在解开后给予
          }
        }, 500);
      }
      if (p.unlocksDoor) {
        setTimeout(() => {
          this.game.state.openedDoors.add(p.unlocksDoor);
          this.toast('某扇门打开了...', 'success');
        }, 600);
      }
      // 通知目标系统
      this.game.checkObjective('SolvePuzzle', p.id);
      setTimeout(() => this.closePuzzle(), 1800);
    } else {
      container.classList.remove('shake');
      void container.offsetWidth; // reflow
      container.classList.add('shake');
      this.audio.playSFX('Puzzle_Fail');
      this.game.renderer.shake(8 * (p.shakeOnFail || 1), 0.4);
      this.game.telemetry.recordPuzzleFailed(p.id, this.puzzleAttempts);
      this.toast(p.failFeedback, 'error');
      this._updatePuzzleAttempts();

      if (this.puzzleAttempts >= p.maxAttempts) {
        this._lockCooldown(5);
      } else {
        setTimeout(() => this.puzzleClear(), 800);
      }
    }
  }

  _lockCooldown(seconds) {
    this.dom.lockCooldown.classList.remove('hidden');
    let t = seconds;
    this.cooldownTime.textContent = t.toFixed(1);
    const iv = setInterval(() => {
      t -= 0.1;
      this.cooldownTime.textContent = Math.max(0, t).toFixed(1);
      if (t <= 0) {
        clearInterval(iv);
        this.dom.lockCooldown.classList.add('hidden');
        this.puzzleClear();
      }
    }, 100);
  }

  _updatePuzzleAttempts() {
    if (!this.currentPuzzle) return;
    this.$('lock-attempts').textContent =
      `尝试: ${this.puzzleAttempts} / ${this.currentPuzzle.maxAttempts}`;
  }

  closePuzzle() {
    this.dom.lockMenu.classList.add('hidden');
    this.currentPuzzle = null;
    this.currentMode = 'game';
    this.dom.hud.classList.remove('hidden');
    this._playClose();
  }

  // ============== 物品检查 ==============
  openExamine(itemData) {
    this.currentMode = 'examine';
    this.currentExamine = itemData;
    this.examineRotation = { x: 0, y: 0 };
    this.showMenu('examineMenu');

    this.$('examine-name').textContent = itemData.displayName;
    this.$('examine-desc').textContent = itemData.description;
    const display = this.$('examine-item-display');
    display.textContent = itemData.icon || '📦';
    display.style.color = itemData.color || '#fff';
    this._updateExamineRotation();

    // 旁白文本 (轮播)
    const flavorEl = this.$('examine-flavor');
    flavorEl.innerHTML = '';
    (itemData.examineTexts || ['仔细看了看这件物品...']).forEach((t, i) => {
      setTimeout(() => {
        const p = document.createElement('p');
        p.style.opacity = 0;
        p.textContent = t;
        flavorEl.appendChild(p);
        requestAnimationFrame(() => { p.style.transition = 'opacity 0.5s'; p.style.opacity = 1; });
      }, i * 2800);
    });

    // Hotspots
    const hs = this.$('examine-hotspots');
    hs.innerHTML = '';
    (itemData.hotspots || []).forEach(h => {
      const el = document.createElement('div');
      el.className = 'hotspot';
      el.style.left = h.x + '%';
      el.style.top = h.y + '%';
      el.title = '点击查看';
      el.onclick = (e) => { e.stopPropagation(); this.toast(h.text, 'info'); };
      hs.appendChild(el);
    });

    // 拾取按钮 - 不可拾取则隐藏
    this.$('btn-examine-pickup').style.display =
      itemData.bIsPickable ? '' : 'none';

    this.audio.playSFX('Int_Pickup');
    this.game.telemetry.recordItemExamine(itemData.id);
  }

  rotateExamine(dx, dy) {
    this.examineRotation.x += dx * 0.4;
    this.examineRotation.y += dy * 0.4;
    this._updateExamineRotation();
    if (Math.random() < 0.15) this.audio.playSFX('Int_Examine_Squeak', 0.3);
  }

  _updateExamineRotation() {
    const el = this.$('examine-item-display');
    const rx = this.examineRotation.y;
    const ry = this.examineRotation.x;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(${1 + Math.abs(rx)*0.0005})`;
  }

  pickupExamineItem() {
    const data = this.currentExamine;
    if (data && data.bIsPickable) {
      this.game.state.collectedItems.add(data.id);
      this.game.telemetry.recordItemCollected(data.id);
      this.game.checkObjective('CollectItem', data.id);
      this.game.checkObjective('CollectCount', this.game.state.collectedItems.size);
      this.toast(`已获得: ${data.displayName}`, 'success');
      this.audio.playSFX('Int_Pickup');
      // 是笔记
      if (data.bIsNote && data.noteId) {
        this.game.state.readNotes.add(data.noteId);
        this.game.telemetry.recordNoteCollected(data.noteId);
        this.game.checkObjective('ReadNote', data.noteId);
      }
      this.closeExamine();
    }
  }

  closeExamine() {
    this.dom.examineMenu.classList.add('hidden');
    this.currentExamine = null;
    this.currentMode = 'game';
    this.dom.hud.classList.remove('hidden');
    this._playClose();
  }

  // ============== 章节结算 ==============
  openChapterComplete(chapterData, stats, nextChapterUnlocked = false) {
    this.currentMode = 'ui';
    this.showMenu('chapterComplete');
    this.audio.playSFX('UI_ChapterComplete');

    this.$('complete-badge').textContent = `第 ${chapterData.id} 章 完成`;
    this.$('complete-chapter-title').textContent = chapterData.title;
    // 统计
    const grid = this.$('stats-grid');
    grid.innerHTML = `
      <div class="stat-row"><span class="stat-label">用时</span><span class="stat-value">${stats.duration}</span></div>
      <div class="stat-row"><span class="stat-label">收集物品</span><span class="stat-value">${stats.itemsDone} / ${stats.itemsTotal}</span></div>
      <div class="stat-row"><span class="stat-label">阅读笔记</span><span class="stat-value">${stats.notesDone} / ${stats.notesTotal}</span></div>
      <div class="stat-row"><span class="stat-label">解开谜题</span><span class="stat-value">${stats.puzzlesDone} / ${stats.puzzlesTotal}</span></div>
      <div class="stat-row"><span class="stat-label">失败次数</span><span class="stat-value">${stats.failCount} 次</span></div>
      <div class="stat-row"><span class="stat-label">完成度</span><span class="stat-value">${stats.completion}%</span></div>
    `;
    // 解锁提示
    const notice = this.$('unlock-notice');
    if (nextChapterUnlocked && nextChapterUnlocked !== true) {
      notice.classList.remove('hidden');
      notice.textContent = `★ 已解锁: 第 ${chapterData.id + 1} 章 · ${nextChapterUnlocked}`;
    } else {
      notice.classList.add('hidden');
    }
    // 下一章按钮
    const nextBtn = this.$('btn-next-chapter');
    if (!nextChapterUnlocked) {
      nextBtn.textContent = '游戏已通关，感谢游玩 ♥';
      nextBtn.disabled = true;
    } else {
      nextBtn.textContent = `继续第 ${chapterData.id + 1} 章 →`;
      nextBtn.disabled = false;
    }
  }

  closeChapterComplete() {
    this.dom.chapterComplete.classList.add('hidden');
    this.currentMode = 'menu';
  }

  // ============== 存档/读档 UI ==============
  openSaveMenu(mode = 'save') {
    this.currentMode = 'ui';
    this.showMenu('saveMenu');
    this.$('save-menu-title').textContent = mode === 'save' ? '保存游戏' : '读取存档';
    this._saveMode = mode;
    this._selectedSlot = -1;
    this._renderSaveSlots();
    this._playOpen();
  }

  _renderSaveSlots() {
    const slots = this.game.save.getSlots();
    const list = this.$('save-slots-list');
    list.innerHTML = '';
    const chapterNames = { 1: '尘封的客厅', 2: '封闭的卧室', 3: '深夜的地下' };
    slots.forEach((slot, i) => {
      const el = document.createElement('div');
      el.className = 'save-slot' + (slot ? '' : ' empty');
      if (slot) {
        const pt = this._fmtTime(slot.playTimeSeconds);
        const d = new Date(slot.saveTime);
        el.innerHTML = `
          <div class="save-slot-num">${i === 0 ? '自动' : '存档 ' + i}</div>
          <div class="save-slot-chapter">第${slot.chapterId}章 · ${chapterNames[slot.chapterId] || ''}</div>
          <div class="save-slot-info">
            物品:${slot.collectedItems?.length || 0} ·
            笔记:${slot.readNotes?.length || 0} ·
            谜题:${slot.solvedPuzzles?.length || 0}
          </div>
          <div class="save-slot-time">${d.toLocaleString('zh-CN',{hour12:false, month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</div>`;
      } else {
        el.innerHTML = `
          <div class="save-slot-num">${i === 0 ? '自动' : '存档 ' + i}</div>
          <div class="save-slot-chapter">（空）</div>
          <div class="save-slot-info">—</div>
          <div class="save-slot-time">—</div>`;
      }
      el.addEventListener('click', () => {
        this._selectedSlot = i;
        document.querySelectorAll('.save-slot').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        this._renderSaveDetails(slot);
        this._playClick();
      });
      list.appendChild(el);
    });
    this.$('save-details').classList.add('hidden');
  }

  _renderSaveDetails(slot) {
    const det = this.$('save-details');
    if (!slot) {
      det.classList.add('hidden'); return;
    }
    const chapterNames = { 1: '尘封的客厅', 2: '封闭的卧室', 3: '深夜的地下' };
    const d = new Date(slot.saveTime);
    this.$('detail-chapter').textContent = `第${slot.chapterId}章 · ${chapterNames[slot.chapterId] || ''}`;
    this.$('detail-time').textContent = d.toLocaleString('zh-CN');
    this.$('detail-playtime').textContent = this._fmtTime(slot.playTimeSeconds);
    this.$('detail-items').textContent = slot.collectedItems?.length || 0;
    this.$('detail-notes').textContent = slot.readNotes?.length || 0;
    this.$('detail-puzzles').textContent = slot.solvedPuzzles?.length || 0;
    det.classList.remove('hidden');
  }

  confirmSaveAction() {
    if (this._selectedSlot < 0) {
      this.toast('请先选择一个存档位', 'warning'); return;
    }
    if (this._saveMode === 'save') {
      if (this._selectedSlot !== 0 && this.game.save.getSlot(this._selectedSlot)) {
        if (!confirm('将覆盖此存档，确认吗？')) return;
      }
      this.game.save.saveGame(this._selectedSlot);
      this.game.telemetry.recordSaveLoad(this._selectedSlot, false);
      this.toast('游戏已保存 ✓', 'success');
      this._renderSaveSlots();
    } else {
      if (!this.game.save.getSlot(this._selectedSlot)) {
        this.toast('此存档位为空', 'warning'); return;
      }
      if (!confirm('读取此存档？当前进度将丢失。')) return;
      const result = this.game.save.loadGame(this._selectedSlot);
      this.game.telemetry.recordSaveLoad(this._selectedSlot, true);
      this.toast('已读取存档', 'success');
      this.closeSaveMenu();
      this.game.startLevel(result.levelId, result.chapterId, result.playerPos);
    }
  }

  deleteSelectedSlot() {
    if (this._selectedSlot < 0 || this._selectedSlot === 0) {
      this.toast(this._selectedSlot === 0 ? '自动存档不可删除' : '请先选择存档', 'warning');
      return;
    }
    if (!confirm('确定删除此存档吗？')) return;
    this.game.save.deleteSlot(this._selectedSlot);
    this.toast('已删除存档', 'info');
    this._renderSaveSlots();
    this.$('save-details').classList.add('hidden');
  }

  closeSaveMenu() {
    this.dom.saveMenu.classList.add('hidden');
    if (this.game.state.inGame) {
      this.currentMode = 'game';
      this.dom.hud.classList.remove('hidden');
    } else {
      this.showMenu('mainMenu');
    }
    this._playClose();
  }

  // ============== 设置 ==============
  _initSettings() {
    const s = this.game?.save?.getSettings?.() || {
      volumes: { master: 100, sfx: 100, ambient: 80, ui: 100 },
      display: { brightness: 100, filmgrain: true, vignette: true },
      controls: { sensitivity: 100, fov: 75 },
      gameplay: { autosave: 5, hints: true, subtitles: true },
    };

    // 填充值
    const set = (id, val, suffix = '') => {
      const el = this.$(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val;
      const label = this.$(id + '-val');
      if (label) label.textContent = val + suffix;
    };
    set('vol-master', s.volumes.master);
    set('vol-sfx', s.volumes.sfx);
    set('vol-ambient', s.volumes.ambient);
    set('vol-ui', s.volumes.ui);
    set('disp-brightness', s.display.brightness);
    this.$('disp-filmgrain').checked = s.display.filmgrain;
    this.$('disp-vignette').checked = s.display.vignette;
    set('ctrl-sensitivity', s.controls.sensitivity);
    set('ctrl-fov', s.controls.fov);
    set('game-autosave', s.gameplay.autosave);
    this.$('game-hints').checked = s.gameplay.hints;
    this.$('game-subtitles').checked = s.gameplay.subtitles;

    this._settingsData = s;
  }

  bindSettingsUI() {
    const trackRange = (id, onChange) => {
      const el = this.$(id);
      if (!el) return;
      const update = () => {
        const label = this.$(id + '-val');
        if (label) label.textContent = el.value;
        onChange && onChange(el);
      };
      el.addEventListener('input', update);
    };
    trackRange('vol-master', () => this.applySettingsLive());
    trackRange('vol-sfx', () => this.applySettingsLive());
    trackRange('vol-ambient', () => this.applySettingsLive());
    trackRange('vol-ui', () => this.applySettingsLive());
    trackRange('disp-brightness');
    trackRange('ctrl-sensitivity');
    trackRange('ctrl-fov');
    trackRange('game-autosave');

    // Tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== 'tab-' + tab));
        this._playHover();
      });
    });

    // 按钮
    this.$('btn-settings-apply').onclick = () => {
      this._collectSettings();
      this.game.save.saveSettings(this._settingsData);
      this.applySettingsLive();
      this.toast('设置已应用', 'success');
      this._playClick();
    };
    this.$('btn-settings-reset').onclick = () => {
      const def = this.game.save._defaultSettings();
      this.applySettingsObject(def);
      this._playClick();
    };
  }

  _collectSettings() {
    const get = (id) => {
      const el = this.$(id);
      if (!el) return null;
      return el.type === 'checkbox' ? el.checked : (el.value | 0);
    };
    this._settingsData = {
      volumes: { master: get('vol-master'), sfx: get('vol-sfx'), ambient: get('vol-ambient'), ui: get('vol-ui') },
      display: { brightness: get('disp-brightness'), filmgrain: get('disp-filmgrain'), vignette: get('disp-vignette') },
      controls: { sensitivity: get('ctrl-sensitivity'), fov: get('ctrl-fov') },
      gameplay: { autosave: get('game-autosave'), hints: get('game-hints'), subtitles: get('game-subtitles') },
    };
    this.game.settings = this._settingsData;
  }

  applySettingsObject(s) {
    const set = (id, val, suffix = '') => {
      const el = this.$(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val;
      const label = this.$(id + '-val');
      if (label) label.textContent = val + suffix;
    };
    set('vol-master', s.volumes.master);
    set('vol-sfx', s.volumes.sfx);
    set('vol-ambient', s.volumes.ambient);
    set('vol-ui', s.volumes.ui);
    set('disp-brightness', s.display.brightness);
    this.$('disp-filmgrain').checked = s.display.filmgrain;
    this.$('disp-vignette').checked = s.display.vignette;
    set('ctrl-sensitivity', s.controls.sensitivity);
    set('ctrl-fov', s.controls.fov);
    set('game-autosave', s.gameplay.autosave);
    this.$('game-hints').checked = s.gameplay.hints;
    this.$('game-subtitles').checked = s.gameplay.subtitles;
    this._settingsData = s;
    this.game.settings = s;
    this.applySettingsLive();
  }

  applySettingsLive() {
    if (!this._settingsData) return;
    const s = this._settingsData;
    // 音量
    this.audio.setVolume('master', s.volumes.master / 100);
    this.audio.setVolume('sfx', s.volumes.sfx / 100);
    this.audio.setVolume('ambient', s.volumes.ambient / 100);
    this.audio.setVolume('ui', s.volumes.ui / 100);
    // 画面
    document.getElementById('film-grain').classList.toggle('disabled', !s.display.filmgrain);
    document.getElementById('vignette').classList.toggle('disabled', !s.display.vignette);
    this.game.renderer.settings.brightness = s.display.brightness / 100;
    this.game.renderer.settings.filmgrain = s.display.filmgrain;
    this.game.renderer.settings.vignette = s.display.vignette;
    // 控制
    this.game.mouseSensitivity = s.controls.sensitivity / 100;
  }

  // ============== 加载画面 ==============
  showLoading(text, tip, duration = 900) {
    this.$('loading-text').textContent = text || '加载中...';
    this.$('loading-tip').textContent = tip || '';
    this.dom.loading.classList.remove('hidden');
    return new Promise(r => setTimeout(() => {
      this.dom.loading.classList.add('hidden');
      r();
    }, duration));
  }

  // ============== 工具 ==============
  _fmtTime(s) {
    s = Math.floor(s);
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }
  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  _playHover()  { this.audio.playSFX('UI_Hover'); }
  _playClick()  { this.audio.playSFX('UI_Click'); }
  _playOpen()   { this.audio.playSFX('UI_WidgetOpen'); }
  _playClose()  { this.audio.playSFX('UI_WidgetClose'); }
}
