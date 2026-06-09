import { globalEventBus, EVENTS } from '../core/EventBus.js';
import { formatTime, formatCountdown, clamp } from '../core/Utils.js';
import { configManager, GAME_STATES, RESOURCE_TYPE, PRIORITY } from '../config/GameConfig.js';
import { saveManager } from '../core/SaveManager.js';

export class UIManager {
  constructor(rootEl, game, mapRenderer, engine) {
    this.root = rootEl;
    this.game = game;
    this.renderer = mapRenderer;
    this.engine = engine;
    this.state = null;
    this.selectedResourceId = null;
    this.selectedTaskId = null;
    this.leftCollapsed = false;
    this.rightCollapsed = false;
    this._buildCache = {};
    this._bindGlobal();
  }

  _bindGlobal() {
    this._listeners = [
      globalEventBus.on(EVENTS.LEVEL_LOAD, (data) => this._onLevelLoad(data)),
      globalEventBus.on(EVENTS.GAME_START, () => this._onGameStart()),
      globalEventBus.on(EVENTS.SATISFACTION_CHANGE, (v) => this._updateSatisfaction(v)),
      globalEventBus.on(EVENTS.SCORE_CHANGE, (v) => this._updateScore(v)),
      globalEventBus.on(EVENTS.COST_CHANGE, (v) => this._updateCost(v)),
      globalEventBus.on(EVENTS.TASK_CREATE, () => this._scheduleTaskPanel()),
      globalEventBus.on(EVENTS.TASK_COMPLETE, () => this._scheduleTaskPanel()),
      globalEventBus.on(EVENTS.TASK_FAIL, () => this._scheduleTaskPanel()),
      globalEventBus.on(EVENTS.TASK_ASSIGN, () => this._scheduleTaskPanel()),
      globalEventBus.on(EVENTS.TASK_SELECT, (t) => this._selectTask(t)),
      globalEventBus.on(EVENTS.RESOURCE_SELECT, (r) => this._selectResource(r)),
      globalEventBus.on(EVENTS.RESOURCE_DISPATCH, () => this._scheduleResourcePanel()),
      globalEventBus.on(EVENTS.RESOURCE_RETURN, () => this._scheduleResourcePanel()),
      globalEventBus.on(EVENTS.EVENT_TRIGGER, (d) => this._onDisasterBanner(d)),
      globalEventBus.on(EVENTS.LEVEL_COMPLETE, (rpt) => this.showReport(rpt, true)),
      globalEventBus.on(EVENTS.LEVEL_FAIL, (rpt) => this.showReport(rpt, false)),
      globalEventBus.on(EVENTS.GAME_PAUSE, () => this.showPauseMenu()),
      globalEventBus.on(EVENTS.GAME_RESUME, () => this.hidePauseMenu()),
    ];
  }

  setState(s) { this.state = s; }

  showMainMenu() {
    this.root.innerHTML = '';
    this.root.appendChild(el('div', { className: 'main-menu anim-fade-in-up' }, [
      el('div', { className: 'version-badge', text: 'Beta v0.1' }),
      el('h1', { className: 'game-logo', text: '迷你城市应急调度' }),
      el('p', { className: 'game-tagline', text: '暴雨 · 停电 · 拥堵 — 每一个决定都关乎这座城市' }),
      el('div', { className: 'modal-actions' }, [
        btn('开始调度', 'primary btn-lg', () => this.showLevelSelect()),
        btn('操作说明', '', () => this.showHelp()),
      ]),
      el('div', { className: 'input-hint', style: 'position:static;margin-top:40px;opacity:0.7' }, [
        span('🖱️ 左键选择/分配 · 右键取消'),
        span('⌨️ WASD/方向键平移 · 滚轮缩放'),
        span('📌 1-5 快捷选择资源 · Q 自动分配'),
      ]),
    ]));
    this.setState(GAME_STATES.MAIN_MENU);
  }

  showLevelSelect() {
    this.root.innerHTML = '';
    const count = configManager.getLevelCount();
    const cards = [];
    for (let i = 1; i <= count; i++) {
      const lvl = configManager.getLevel(i);
      const unlocked = saveManager.isLevelUnlocked(i);
      const stars = saveManager.getLevelStars(i);
      cards.push(el('div', {
        className: 'level-card anim-fade-in-up' + (!unlocked ? ' locked' : '') + (stars > 0 ? ' completed' : ''),
        onclick: () => { if (unlocked) this._startLevel(i); },
        style: `animation-delay:${i * 60}ms`,
      }, [
        el('div', { className: 'level-num', text: unlocked ? i : '🔒' }),
        el('div', { className: 'level-name', text: lvl.name }),
        el('div', { style: 'font-size:11px;color:#94a3b8;margin:4px 0 6px', text: lvl.description }),
        el('div', { style: 'font-size:10px;color:#64748b', text: `⏱ ${formatTime(lvl.duration)} · 难度 ${'★'.repeat(lvl.difficulty)}` }),
        el('div', { className: 'level-stars', text: unlocked ? starDisplay(stars) : '' }),
      ]));
    }
    this.root.appendChild(el('div', { className: 'modal-overlay anim-fade-in', style: 'z-index:100;position:absolute' }, [
      el('div', { className: 'panel modal anim-fade-in-up' }, [
        el('h2', { className: 'modal-title', text: '选择关卡' }),
        el('p', { className: 'modal-subtitle', text: '完成关卡可解锁下一关，三星可获额外奖励' }),
        el('div', { className: 'level-select-grid' }, cards),
        el('div', { className: 'modal-actions' }, [
          btn('返回', '', () => this.showMainMenu()),
        ]),
      ]),
    ]));
    this.setState(GAME_STATES.LEVEL_SELECT);
  }

  showHelp() {
    this.root.appendChild(el('div', { className: 'modal-overlay anim-fade-in', id: 'help-overlay', style: 'z-index:200' }, [
      el('div', { className: 'panel modal anim-fade-in-up' }, [
        el('h2', { className: 'modal-title', text: '操作说明' }),
        el('div', { style: 'line-height:1.9;font-size:14px;color:#cbd5e1;display:grid;grid-template-columns:1fr 1fr;gap:8px 24px' }, [
          helpRow('🖱️ 左键', '选择任务/资源，点击分配'),
          helpRow('🖱️ 右键', '取消选择 / 取消任务'),
          helpRow('🖱️ 拖拽', '平移地图（左键按住或右键）'),
          helpRow('🖱️ 滚轮', '缩放地图'),
          helpRow('⌨️ WASD / 方向键', '平移地图'),
          helpRow('⌨️ +/-', '缩放地图'),
          helpRow('⌨️ 1-5', '快捷选择资源类型'),
          helpRow('⌨️ Q', '为选中任务自动分配最优资源'),
          helpRow('⌨️ Space', '暂停 / 继续'),
          helpRow('⌨️ Esc', '返回菜单'),
          helpRow('⌨️ R', '重新开始当前关卡'),
          helpRow('⌨️ ~', '打开/关闭调试面板'),
          helpRow('🎮 左摇杆', '平移地图'),
          helpRow('🎮 右摇杆 / L1 R1', '缩放地图'),
          helpRow('🎮 A / X', '确认/选择'),
          helpRow('🎮 B / 〇', '取消/返回'),
          helpRow('📱 单指拖拽', '平移地图'),
          helpRow('📱 双指捏合', '缩放地图'),
          helpRow('📱 单击', '选择 / 分配'),
        ]),
        el('div', { className: 'modal-actions' }, [
          btn('我知道了', 'primary', () => document.getElementById('help-overlay')?.remove()),
        ]),
      ]),
    ]));
  }

  _startLevel(id) {
    this.game.startLevel(id);
    this.renderer.setMap(this.game.map);
    this.showHUD();
    this.setState(GAME_STATES.PLAYING);
    globalEventBus.emit(EVENTS.BGM_PLAY);
  }

  _onLevelLoad() {
    // map already set in _startLevel
  }

  _onGameStart() {
    this._lastTick = performance.now();
    this._hudDirty = true;
    this._taskPanelDirty = true;
    this._resourcePanelDirty = true;
  }

  showHUD() {
    this.root.innerHTML = '';
    this.root.appendChild(el('div', { className: 'hud anim-fade-in' }, [
      el('div', { className: 'hud-left' }, [
        hudStat('得分', 'hud-score', '0', ''),
        hudStat('预算', 'hud-budget', '0', 'success', true),
        hudSatisfaction(80),
      ]),
      el('div', { className: 'hud-center' }, [
        el('div', { className: 'hud-timer', id: 'hud-timer', text: '00:00' }),
      ]),
      el('div', { className: 'hud-right' }, [
        el('button', {
          className: 'btn hud-btn', id: 'btn-automode',
          title: '自动模式（Q）', text: '⚡',
          onclick: () => this._autoAssign(),
        }),
        el('button', {
          className: 'btn hud-btn', id: 'btn-pause',
          title: '暂停（Space）', text: '⏸',
          onclick: () => this._togglePause(),
        }),
        el('button', {
          className: 'btn hud-btn', id: 'btn-restart',
          title: '重玩（R）', text: '🔄',
          onclick: () => this._confirmRestart(),
        }),
        el('button', {
          className: 'btn hud-btn', id: 'btn-menu',
          title: '菜单（Esc）', text: '🏠',
          onclick: () => this._confirmMenu(),
        }),
      ]),
    ]));

    this.root.appendChild(this._buildTaskPanel());
    this.root.appendChild(this._buildResourcePanel());
    this.root.appendChild(el('div', { className: 'action-bar', id: 'action-bar' }));
    this.root.appendChild(el('div', {
      className: 'input-hint',
      innerHTML: '<span><kbd>1-5</kbd> 选择资源</span><span><kbd>Q</kbd> 自动分配</span><span><kbd>Space</kbd> 暂停</span><span><kbd>Esc</kbd> 菜单</span>',
    }));

    this._scheduleTaskPanel();
    this._scheduleResourcePanel();
    this._tickHUD();
  }

  _buildTaskPanel() {
    return el('div', { className: 'side-panel right panel', id: 'task-panel' }, [
      el('div', { className: 'panel-header' }, [
        el('div', { className: 'panel-title', text: '📋 任务列表' }),
        el('button', {
          className: 'panel-collapse-btn',
          onclick: () => this._togglePanel('right'),
          text: '›',
          id: 'task-collapse',
        }),
      ]),
      el('div', { className: 'panel-body', id: 'task-panel-body' }, []),
    ]);
  }

  _buildResourcePanel() {
    return el('div', { className: 'side-panel left panel', id: 'resource-panel' }, [
      el('div', { className: 'panel-header' }, [
        el('div', { className: 'panel-title', text: '🚚 资源调度' }),
        el('button', {
          className: 'panel-collapse-btn',
          onclick: () => this._togglePanel('left'),
          text: '‹',
          id: 'resource-collapse',
        }),
      ]),
      el('div', { className: 'panel-body', id: 'resource-panel-body' }, []),
    ]);
  }

  _togglePanel(side) {
    const p = document.getElementById(side === 'left' ? 'resource-panel' : 'task-panel');
    const btn = document.getElementById(side === 'left' ? 'resource-collapse' : 'task-collapse');
    if (!p) return;
    p.classList.toggle('collapsed');
    if (btn) btn.textContent = p.classList.contains('collapsed')
      ? (side === 'left' ? '›' : '‹')
      : (side === 'left' ? '‹' : '›');
  }

  _scheduleTaskPanel() { this._taskPanelDirty = true; }
  _scheduleResourcePanel() { this._resourcePanelDirty = true; }

  _tickHUD() {
    if (this.state !== GAME_STATES.PLAYING && this.state !== GAME_STATES.PAUSED) return;
    const now = performance.now();
    if (now - this._lastTick < 100) {
      requestAnimationFrame(() => this._tickHUD());
      return;
    }
    this._lastTick = now;

    const g = this.game;
    const tEl = document.getElementById('hud-timer');
    if (tEl) {
      const s = formatTime(g.timeRemaining);
      if (tEl.textContent !== s) {
        tEl.textContent = s;
        if (g.timeRemaining < 30) tEl.style.color = '#f87171';
        else if (g.timeRemaining < 60) tEl.style.color = '#facc15';
        else tEl.style.color = '';
      }
    }
    this._updateScore(g.score, true);
    this._updateCost(g.cost, true);
    this._updateSatisfaction(g.satisfaction, true);

    if (this._taskPanelDirty) {
      this._taskPanelDirty = false;
      this._renderTasks();
    }
    if (this._resourcePanelDirty) {
      this._resourcePanelDirty = false;
      this._renderResources();
    }
    requestAnimationFrame(() => this._tickHUD());
  }

  _updateScore(v, silent) {
    const el = document.getElementById('hud-score');
    if (el && el.textContent !== v.toString()) el.textContent = v.toString();
  }

  _updateCost(v, silent) {
    const bEl = document.getElementById('hud-budget');
    if (!bEl) return;
    const remaining = this.game.budget;
    const s = remaining >= 1000 ? (remaining / 1000).toFixed(1) + 'K' : remaining.toString();
    if (bEl.textContent !== s) bEl.textContent = s;
    const parent = bEl.parentElement;
    parent.classList.toggle('danger', remaining < 1000);
    parent.classList.toggle('success', remaining >= 1000 && remaining < 4000);
  }

  _updateSatisfaction(v, silent) {
    const val = document.getElementById('hud-sat-value');
    const fill = document.getElementById('hud-sat-fill');
    const bar = document.getElementById('hud-sat-bar');
    const pct = clamp(v, 0, 100);
    if (val) val.textContent = `${pct.toFixed(0)}%`;
    if (fill) {
      fill.style.width = pct + '%';
      const c = pct > 60 ? 'var(--color-success)' : pct > 30 ? 'var(--color-warning)' : 'var(--color-danger)';
      fill.style.background = c;
    }
    if (bar) bar.classList.toggle('danger', pct < 30);
  }

  _renderTasks() {
    const body = document.getElementById('task-panel-body');
    if (!body) return;
    const tasks = this.game.tasks.getSortedActive();
    if (tasks.length === 0) {
      body.innerHTML = '<div style="text-align:center;padding:24px;color:#64748b;font-size:13px">暂无任务<br><span style="font-size:11px">请保持准备状态</span></div>';
      return;
    }
    const counts = this.game.tasks.countByStatus();
    const frag = document.createDocumentFragment();
    const summary = el('div', {
      style: 'padding:4px 8px;margin-bottom:10px;background:rgba(56,189,248,0.08);border-radius:6px;font-size:11px;display:flex;justify-content:space-between;color:#94a3b8',
    }, [
      span(`活动: ${counts.active}`),
      span(`待派: ${counts.pending}`),
      span(`已完: ${counts.completed}`),
      span(`失败: ${counts.failed}`),
    ]);
    frag.appendChild(summary);

    for (const t of tasks) {
      const urgency = t.getUrgency();
      const def = t.def;
      const item = el('div', {
        className: `task-item priority-${t.priority} anim-slide-in-right ${t.id === this.selectedTaskId ? 'selected' : ''}`,
        onclick: (e) => {
          e.stopPropagation();
          this._onTaskClick(t);
        },
        'data-task-id': t.id,
      }, [
        el('div', { className: 'task-header' }, [
          el('div', { className: 'task-title', text: t.title }),
          el('div', { className: `task-priority-badge priority-${t.priority}`, text: configManager.getPriorityLabel(t.priority) }),
        ]),
        el('div', { className: 'task-desc', text: t.description + (t.assignedResourceId ? ' · 处理中' : '') }),
        el('div', { className: 'task-progress' }, [
          el('div', {
            className: 'task-progress-fill',
            style: `width:${clamp(t.workProgress * 100, 0, 100)}%;background:${t._markerColor}`,
          }),
        ]),
        el('div', { className: 'task-meta' }, [
          el('span', {
            className: 'task-time-remaining' + (t.timeRemaining < t.timeLimit * 0.3 ? ' danger' : ''),
            text: `⏱ ${formatCountdown(t.timeRemaining)}`,
          }),
          el('span', { className: 'task-reward', text: `+¥${t.reward}` }),
        ]),
      ]);
      if (urgency > 0.7 && t.timeRemaining < t.timeLimit * 0.3) {
        item.style.animation = 'pulse-glow 1.4s infinite';
      }
      frag.appendChild(item);
    }
    body.replaceChildren(frag);
  }

  _renderResources() {
    const body = document.getElementById('resource-panel-body');
    if (!body) return;
    const groups = {};
    for (const r of this.game.resources.resources) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    const frag = document.createDocumentFragment();
    const avail = this.game.resources.getAvailable().length;
    const total = this.game.resources.resources.length;
    frag.appendChild(el('div', {
      style: 'padding:4px 8px;margin-bottom:10px;background:rgba(74,222,128,0.08);border-radius:6px;font-size:11px;display:flex;justify-content:space-between;color:#94a3b8',
    }, [
      span(`闲置: ${avail}/${total}`),
      span(`调度: ${total - avail}`),
    ]));

    let shortcutIdx = 0;
    for (const type of Object.keys(groups)) {
      shortcutIdx++;
      const def = configManager.getResourceDef(type);
      const list = groups[type];
      const g = el('div', { className: 'resource-group' }, [
        el('div', { className: 'resource-group-title', text: `${def.icon} ${def.name} (${list.length})  [${shortcutIdx}]` }),
      ]);
      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        const task = r.currentTaskId ? this.game.tasks.get(r.currentTaskId) : null;
        const classes = ['resource-card'];
        if (r.id === this.selectedResourceId) classes.push('selected');
        if (!r.isAvailable()) classes.push('busy');
        const card = el('div', {
          className: classes.join(' '),
          onclick: (e) => { e.stopPropagation(); this._onResourceClick(r); },
          'data-res-id': r.id,
        }, [
          el('div', { className: 'resource-icon', style: `background:${def.color}22;color:${def.color}`, text: def.icon }),
          el('div', { className: 'resource-info' }, [
            el('div', { className: 'resource-name', text: `${def.name} #${i + 1}` }),
            el('div', {
              className: `resource-status ${r.status === 'idle' ? 'idle' : r.status === 'working' ? 'busy' : 'busy'}`,
              text: this._resourceStatusText(r, task),
            }),
          ]),
        ]);
        g.appendChild(card);
      }
      frag.appendChild(g);
    }
    body.replaceChildren(frag);
  }

  _resourceStatusText(r, task) {
    switch (r.status) {
      case 'idle': return '🟢 待命';
      case 'moving': return '🟡 前往' + (task ? ` → ${task.title.slice(0, 8)}` : '');
      case 'arrived': return '🟡 已到达';
      case 'working': return `🔧 作业中 ${(r.workProgress * 100).toFixed(0)}%`;
      case 'returning': return '🔵 返回中';
      default: return r.status;
    }
  }

  _onTaskClick(t) {
    this.selectedTaskId = t.id;
    this.game.tasks.select(t.id);
    this.renderer.setSelection(t.x, t.y, t._markerColor);
    this._scheduleTaskPanel();
    globalEventBus.emit(EVENTS.SFX_PLAY, 'select');

    const selRes = this.game.resources.getSelected();
    if (selRes) {
      this.assignResourceToTask(selRes, t);
    }
  }

  _onResourceClick(r) {
    this.game.resources.select(r.id);
    this.selectedResourceId = r.id;
    this._scheduleResourcePanel();
    globalEventBus.emit(EVENTS.SFX_PLAY, 'select');

    const selTask = this.game.tasks.getSelected();
    if (selTask && r.isAvailable()) {
      this.assignResourceToTask(r, selTask);
    }
  }

  assignResourceToTask(r, t) {
    if (!r.isAvailable() || t.assignedResourceId) return;
    const ok = this.game.assignResourceToTask(r, t);
    if (ok) {
      const path = this.game.map.findPathOnRoad(r.x, r.y, t.x, t.y);
      if (path) this.renderer.setRoutePreview(path, r.config.color);
      this.renderer.addEventBanner(t.x, t.y, `${r.config.icon} 已派遣`, '#4ade80');
      this.renderer.setSelection(t.x, t.y, '#4ade80');
      globalEventBus.emit(EVENTS.UI_TOAST, { message: `${r.config.name} 已派遣前往 ${t.title}`, type: 'success' });
      globalEventBus.emit(EVENTS.SFX_PLAY, 'dispatch');
    }
    this.selectedTaskId = null;
    this.selectedResourceId = null;
    this.game.resources.deselect();
    this._scheduleTaskPanel();
    this._scheduleResourcePanel();
  }

  _autoAssign() {
    const t = this.game.tasks.getSelected() || this.game.tasks.getSortedActive()[0];
    if (!t) {
      globalEventBus.emit(EVENTS.UI_TOAST, { message: '没有需要处理的任务', type: 'info' });
      return;
    }
    this._onTaskClick(t);
    const r = this.game.autoDispatch(t);
    if (r) {
      this.selectedTaskId = null;
      this.selectedResourceId = r.id;
      this.renderer.setSelection(t.x, t.y, '#4ade80');
      this.renderer.addEventBanner(t.x, t.y, `${r.config.icon} 自动派遣`, '#4ade80');
      globalEventBus.emit(EVENTS.SFX_PLAY, 'dispatch');
      this._scheduleTaskPanel();
      this._scheduleResourcePanel();
    } else {
      globalEventBus.emit(EVENTS.SFX_PLAY, 'warning');
    }
  }

  _selectTask(t) {
    this.selectedTaskId = t.id;
    this.renderer.setSelection(t.x, t.y, t._markerColor);
    this._scheduleTaskPanel();
  }
  _selectResource(r) {
    this.selectedResourceId = r.id;
    this._scheduleResourcePanel();
  }

  _onDisasterBanner(d) {
    this.renderer.shake(0.5, 10);
    this.renderer.emitParticles(d.x, d.y, d.def.color, 20, { speedMax: 160, lifeMax: 1.2 });
    this.renderer.addEventBanner(d.x, d.y, `⚠️ ${d.def.name}！`, '#ef4444');
    const existing = document.getElementById('disaster-banner');
    if (existing) existing.remove();
    const banner = el('div', {
      className: 'event-banner anim-fade-in-up',
      id: 'disaster-banner',
      text: `${d.def.icon} ${d.def.name}：${d.def.description}`,
    });
    this.root.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
    globalEventBus.emit(EVENTS.SFX_PLAY, 'disaster');
  }

  _togglePause() {
    if (this.engine.paused) this.engine.resume();
    else this.engine.pause();
  }

  showPauseMenu() {
    const existing = document.getElementById('pause-overlay');
    if (existing) return;
    this.root.appendChild(el('div', { className: 'modal-overlay anim-fade-in', id: 'pause-overlay' }, [
      el('div', { className: 'panel modal anim-fade-in-up', style: 'width:min(380px,90vw)' }, [
        el('h2', { className: 'modal-title', text: '游戏暂停' }),
        el('div', { className: 'modal-actions', style: 'flex-direction:column' }, [
          btn('继续游戏', 'primary btn-lg', () => { document.getElementById('pause-overlay').remove(); this.engine.resume(); }),
          btn('重玩本关', '', () => { document.getElementById('pause-overlay').remove(); this._restart(); }),
          btn('返回关卡选择', '', () => { document.getElementById('pause-overlay').remove(); this._backToLevelSelect(); }),
          btn('操作说明', '', () => this.showHelp()),
        ]),
      ]),
    ]));
  }

  hidePauseMenu() { document.getElementById('pause-overlay')?.remove(); }

  _confirmRestart() {
    this.showConfirm('确认重玩？', '当前进度将丢失', () => this._restart());
  }

  _confirmMenu() {
    this.showConfirm('返回主菜单？', '当前进度将丢失', () => this._backToMainMenu());
  }

  showConfirm(title, msg, onConfirm) {
    this.root.appendChild(el('div', { className: 'modal-overlay anim-fade-in', id: 'confirm-overlay', style: 'z-index:300' }, [
      el('div', { className: 'panel modal anim-fade-in-up', style: 'width:min(380px,90vw)' }, [
        el('h3', { style: 'font-size:18px;font-weight:700;text-align:center;margin-bottom:8px', text: title }),
        el('p', { style: 'text-align:center;color:#94a3b8;margin-bottom:16px', text: msg }),
        el('div', { className: 'modal-actions' }, [
          btn('取消', '', () => document.getElementById('confirm-overlay')?.remove()),
          btn('确定', 'danger', () => { document.getElementById('confirm-overlay').remove(); onConfirm(); }),
        ]),
      ]),
    ]));
  }

  _restart() {
    globalEventBus.emit(EVENTS.GAME_RESTART);
    this.game.retryLevel();
    this.renderer.setMap(this.game.map);
    this.selectedTaskId = null;
    this.selectedResourceId = null;
    this.showHUD();
    this.setState(GAME_STATES.PLAYING);
    globalEventBus.emit(EVENTS.BGM_PLAY);
  }

  _backToLevelSelect() {
    globalEventBus.emit(EVENTS.BGM_STOP);
    this.game.state = GAME_STATES.LEVEL_SELECT;
    this.showLevelSelect();
  }

  _backToMainMenu() {
    globalEventBus.emit(EVENTS.BGM_STOP);
    this.game.state = GAME_STATES.MAIN_MENU;
    this.showMainMenu();
  }

  showReport(report, victory) {
    this.root.innerHTML = '';
    globalEventBus.emit(EVENTS.SFX_PLAY, victory ? 'level_win' : 'level_lose');
    const unlockInfo = victory
      ? saveManager.recordLevelResult(report.levelId, report.stars, report.score)
      : { nextLevel: report.levelId + 1, nextUnlocked: false };
    const s = report.stats;

    const starsHtml = starDisplay(report.stars, true);

    const breakdown = report.scoreBreakdown.map(b => el('div', {
      style: 'display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed rgba(100,116,139,0.15);font-size:13px;' + (b.final ? 'font-weight:700;border-top:2px solid rgba(56,189,248,0.3);border-bottom:none;padding-top:10px;margin-top:4px' : ''),
    }, [
      span(b.label),
      el('span', {
        style: `font-variant-numeric:tabular-nums;color:${b.final ? '#38bdf8' : (b.good ? '#4ade80' : '#f87171')}`,
        text: (b.value >= 0 ? '+' : '') + b.value,
      }),
    ]));

    const starsDelay = victory ? 800 : 0;

    const overlay = el('div', { className: 'modal-overlay anim-fade-in' }, [
      el('div', { className: 'panel modal anim-fade-in-up' }, [
        el('h2', {
          className: 'modal-title',
          text: victory ? '🏆 任务完成！' : '💥 调度失败',
          style: `color:${victory ? '#4ade80' : '#f87171'}`,
        }),
        el('p', { className: 'modal-subtitle', text: `${report.levelName} · 用时 ${formatTime(s.duration)}` }),

        victory ? el('div', { className: 'stars-display', id: 'stars-display' }, '') : '',

        el('div', { className: 'score-display' }, [
          el('div', { className: 'score-number', id: 'report-score', text: '0' }),
          el('div', { className: 'score-label', text: '最终得分' }),
        ]),

        el('div', { className: 'report-section' }, [
          el('div', { className: 'report-section-title', text: '📊 核心数据' }),
          el('div', { className: 'stat-grid' }, [
            statCell(s.completed, '任务完成', s.completed >= s.targetCompleted ? 'good' : 'bad', `目标 ${s.targetCompleted}`),
            statCell(`${s.satisfaction.toFixed(0)}%`, '最终满意度', s.satisfaction >= s.targetSatisfaction ? 'good' : 'bad', `目标 ${s.targetSatisfaction}%`),
            statCell(s.failed, '任务失败', s.failed === 0 ? 'good' : 'bad'),
            statCell(s.mistakes, '操作失误', s.mistakes <= 2 ? 'good' : 'bad'),
            statCell(formatTime(s.duration), '总用时', ''),
            statCell(`¥${s.cost}`, '累计成本', s.cost < 5000 ? 'good' : 'bad'),
            statCell(`${s.avgLatency}s`, '平均响应', +s.avgLatency < 15 ? 'good' : 'bad'),
            statCell(`¥${Math.max(0, s.budget)}`, '预算结余', s.budget > 0 ? 'good' : 'bad'),
          ]),
        ]),

        el('div', { className: 'report-section' }, [
          el('div', { className: 'report-section-title', text: '💰 得分明细' }),
          ...breakdown,
        ]),

        unlockInfo.nextUnlocked ? el('div', {
          style: 'padding:14px;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.3);border-radius:10px;text-align:center;margin-top:8px',
        }, [
          el('div', { style: 'color:#4ade80;font-weight:700;font-size:15px', text: '🔓 解锁新关卡' }),
          el('div', { style: 'color:#94a3b8;font-size:12px;margin-top:4px', text: `第 ${unlockInfo.nextLevel} 关已可挑战` }),
        ]) : '',

        el('div', { className: 'modal-actions' }, [
          btn('返回菜单', '', () => this._backToMainMenu()),
          !victory ? btn('重试', 'btn-danger btn-lg', () => this._restart()) : '',
          victory && unlockInfo.nextUnlocked
            ? btn(`挑战下一关 →`, 'primary btn-lg', () => this._startLevel(unlockInfo.nextLevel))
            : btn('再玩一次', 'primary btn-lg', () => this._restart()),
        ]),
      ]),
    ]);
    this.root.appendChild(overlay);

    setTimeout(() => this._animateScore(report.score), 400);
    if (victory) setTimeout(() => this._animateStars(report.stars), starsDelay);

    this.setState(victory ? GAME_STATES.REPORT : GAME_STATES.FAILURE);
  }

  _animateScore(target) {
    const el = document.getElementById('report-score');
    if (!el) return;
    let cur = 0;
    const dur = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      cur = Math.round(target * eased);
      el.textContent = cur.toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _animateStars(count) {
    const el = document.getElementById('stars-display');
    if (!el) return;
    const total = 3;
    el.innerHTML = starDisplay(0, true);
    const fillOne = (idx) => {
      if (idx > count) return;
      const stars = document.querySelectorAll('#stars-display .star');
      if (stars[idx - 1]) {
        stars[idx - 1].classList.replace('star-empty', 'star-filled');
        stars[idx - 1].style.animation = 'easeOutBounce 0.6s';
        globalEventBus.emit(EVENTS.SFX_PLAY, 'star');
      }
      setTimeout(() => fillOne(idx + 1), 400);
    };
    setTimeout(() => fillOne(1), 100);
  }

  selectByShortcut(typeIdx) {
    const types = Object.keys(RESOURCE_TYPE);
    const type = types[typeIdx];
    if (!type) return;
    const list = this.game.resources.getByType(type);
    const first = list.find(r => r.isAvailable()) || list[0];
    if (first) this._onResourceClick(first);
  }

  cancelSelection() {
    this.selectedTaskId = null;
    this.selectedResourceId = null;
    this.game.resources.deselect();
    this.renderer.setRoutePreview(null);
    this._scheduleTaskPanel();
    this._scheduleResourcePanel();
  }

  destroy() {
    this._listeners.forEach(off => off());
  }
}

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v === null || v === undefined) continue;
    if (k === 'className') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      e.addEventListener(k.slice(2).toLowerCase(), (ev) => v(ev));
    } else if (k === 'text') e.textContent = v;
    else if (k === 'innerHTML') e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined || c === false || c === '') return;
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

function btn(text, cls = '', handler = null) {
  return el('button', {
    className: 'btn ' + cls,
    text,
    onclick: handler,
  });
}

function span(t) { return el('span', { text: t }); }

function hudStat(label, id, value, cls = '', hasBar = false) {
  const childs = [
    el('div', { className: 'hud-stat-label', text: label }),
    el('div', { className: 'hud-stat-value', id, text: value }),
  ];
  return el('div', { className: 'hud-stat ' + cls }, childs);
}

function hudSatisfaction(v) {
  return el('div', { className: 'hud-stat', id: 'hud-sat-bar' }, [
    el('div', { className: 'hud-stat-label', text: '满意度' }),
    el('div', { className: 'hud-stat-value', id: 'hud-sat-value', text: v + '%' }),
    el('div', { className: 'hud-satisfaction-bar' }, [
      el('div', {
        className: 'hud-satisfaction-fill', id: 'hud-sat-fill',
        style: `width:${v}%;background:var(--color-success)`,
      }),
    ]),
  ]);
}

function helpRow(k, v) {
  return el('div', {
    style: 'display:flex;justify-content:space-between;gap:12px;padding:6px 10px;background:rgba(100,116,139,0.06);border-radius:6px',
  }, [
    el('span', { style: 'color:#38bdf8;font-weight:600', text: k }),
    el('span', { style: 'color:#cbd5e1', text: v }),
  ]);
}

function statCell(value, label, cls = '', hint = '') {
  return el('div', { className: 'stat-item' }, [
    el('div', { className: `stat-value ${cls}`, text: value }),
    el('div', { className: 'stat-label', text: label + (hint ? ` · ${hint}` : '') }),
  ]);
}

function starDisplay(n, animate = false) {
  let html = '';
  for (let i = 1; i <= 3; i++) {
    const cls = i <= n ? 'star-filled' : 'star-empty';
    html += `<span class="star ${cls}" style="${animate ? 'transition:all 0.3s' : ''}">★</span>`;
  }
  return html;
}
