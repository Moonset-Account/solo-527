import { BaseScene } from './BaseScene.js';
import { SCENES } from '../core/SceneManager.js';
import { getLevel } from '../data/levels.js';
import { RoadNetwork } from '../game/RoadNetwork.js';
import { TrafficLight } from '../game/TrafficLight.js';
import { TrafficSystem } from '../game/TrafficSystem.js';
import { BusSystem } from '../game/BusSystem.js';
import { ScoreSystem } from '../game/ScoreSystem.js';
import { ReplaySystem } from '../game/ReplaySystem.js';

export class GameScene extends BaseScene {
  _setupUI(params) {
    this.levelId = params.levelId || 'level_1';
    this.levelData = getLevel(this.levelId);
    if (!this.levelData) {
      this._showToast('❌ 关卡数据不存在', 'error');
      this.sceneManager.changeTo(SCENES.MENU);
      return;
    }
    this.isSandbox = params.mode === 'sandbox' || false;
    this.elapsed = 0;
    this.running = true;
    this.finished = false;
    this.lastMetrics = null;
    this.comparisonMetrics = params.comparisonMetrics || null;
    this.roadNetwork = null;
    this.trafficLights = [];
    this.trafficSystem = null;
    this.busSystem = null;
    this.scoreSystem = new ScoreSystem(this.levelData);
    this.replaySystem = null;
    this.selectedIntersection = this.levelData.intersections[0]?.id || null;
    this.prevResult = params.prevResult || null;
    this.adjustmentHistory = [];
    this.pendingAdjustment = null;
    this.baselineMetrics = null;
    this._buildScene();
    this._buildHUD();
    this._buildControlPanel();
    this._buildSimControls();
    this._buildAdjustmentHistoryPanel();
    this._buildComparisonPanel();
    if (this.levelData.tutorialHints?.length && !params.skippedTutorial) {
      setTimeout(() => this._showLevelTutorial(), 500);
    }
    setTimeout(() => {
      this.baselineMetrics = this._captureMetricsSnapshot();
      this._showToast('✅ 基线已建立，可以开始调整策略', 'success', 2500);
    }, 5000);
  }

  _buildScene() {
    this.roadNetwork = new RoadNetwork(this.renderEngine.scene, this.levelData);
    for (const int of this.levelData.intersections) {
      const light = new TrafficLight(this.renderEngine.scene, int, {
        cycleTime: 60,
        nsGreenRatio: 0.5,
        busPriorityEnabled: false
      });
      this.trafficLights.push(light);
    }
    this.trafficSystem = new TrafficSystem(
      this.renderEngine.scene, this.roadNetwork, this.trafficLights, this.levelData
    );
    this.busSystem = new BusSystem(
      this.renderEngine.scene, this.roadNetwork, this.trafficLights, this.levelData
    );
    this.busSystem.trafficSystem = this.trafficSystem;
    this.replaySystem = new ReplaySystem(this.renderEngine.scene);
    this.trafficSystem.start();
  }

  _buildHUD() {
    const hud = this._createElement('div', 'hud');
    const stats = this._createElement('div', 'hud-stats');

    this.hudTime = this._hudStat('⏱ 剩余时间', `${this.levelData.duration}s`, '');
    this.hudCongestion = this._hudStat('📊 拥堵指数', '0%', 'good');
    this.hudAvgSpeed = this._hudStat('🚗 平均速度', '0 km/h', 'good');
    this.hudBus = this._hudStat('🚌 准点率', '100%', 'good');
    stats.appendChild(this.hudTime.el);
    stats.appendChild(this.hudCongestion.el);
    stats.appendChild(this.hudAvgSpeed.el);
    stats.appendChild(this.hudBus.el);

    const actions = this._createElement('div', 'hud-actions');

    const btnPause = this._h('button', {
      className: 'icon-btn',
      textContent: '⏸',
      title: '暂停/继续 (空格)',
      onclick: () => {
        this.audioManager.playClick();
        this.eventBus.emit('game:pauseToggled');
      }
    });
    const btnReplay = this._h('button', {
      className: 'icon-btn',
      textContent: '↻',
      title: '回放 (R)',
      onclick: () => {
        this.audioManager.playClick();
        this._startReplay();
      }
    });
    const btnMenu = this._h('button', {
      className: 'icon-btn',
      textContent: '☰',
      title: '菜单',
      onclick: () => {
        this.audioManager.playClick();
        this._confirmQuit();
      }
    });
    actions.appendChild(btnPause);
    actions.appendChild(btnReplay);
    actions.appendChild(btnMenu);

    hud.appendChild(stats);
    hud.appendChild(actions);
    this._mountUI(hud);
  }

  _hudStat(label, value, cls) {
    const el = this._createElement('div', 'hud-stat');
    const labelEl = this._createElement('div', 'hud-stat-label', label);
    const valEl = this._h('div', {
      className: `hud-stat-value ${cls}`,
      textContent: value
    });
    el.appendChild(labelEl);
    el.appendChild(valEl);
    return { el, labelEl, valEl };
  }

  _buildControlPanel() {
    const panel = this._createElement('div', 'panel control-panel');

    if (this.trafficLights.length > 1) {
      const tabs = this._createElement('div', 'intersection-tabs');
      this.levelData.intersections.forEach((int) => {
        const tab = this._h('button', {
          className: `intersection-tab ${int.id === this.selectedIntersection ? 'active' : ''}`,
          textContent: int.name,
          onclick: () => {
            this.audioManager.playClick();
            this.selectedIntersection = int.id;
            Array.from(tabs.children).forEach((c, i) => {
              c.classList.toggle('active', this.levelData.intersections[i].id === int.id);
            });
            this._refreshSliders();
          }
        });
        tabs.appendChild(tab);
      });
      panel.appendChild(tabs);
    }

    const title1 = this._createElement('div', 'control-title', '🚦 信号灯设置');
    const groupCycle = this._sliderGroup('信号灯周期', 60, 30, 120, 1, '秒');
    const groupRatio = this._sliderGroup('南北绿灯占比', 50, 20, 75, 1, '%');
    const groupYellow = this._sliderGroup('黄灯时间', 3, 2, 6, 1, '秒');

    const title2 = this._createElement('div', 'control-title', '⚙️ 规则设置');
    const toggleGroup = this._createElement('div', 'toggle-group');

    const toggleBus = this._toggleItem('🚌 公交优先', false);
    const toggleTurn = this._toggleItem('↪️ 红灯允许右转', true);

    toggleGroup.appendChild(toggleBus);
    toggleGroup.appendChild(toggleTurn);

    panel.appendChild(title1);
    panel.appendChild(groupCycle);
    panel.appendChild(groupRatio);
    panel.appendChild(groupYellow);
    panel.appendChild(title2);
    panel.appendChild(toggleGroup);

    this._mountUI(panel);
    this._refreshSliders();
  }

  _sliderGroup(label, defaultValue, min, max, step, unit) {
    const key = label;
    const group = this._h('div', { className: 'slider-group', dataset: { key } });
    const labelLine = this._h('div', { className: 'slider-label' }, [
      this._h('span', { textContent: label }),
      this._h('span', { className: 'slider-value', textContent: `${defaultValue}${unit}` })
    ]);
    const dragState = { snapshot: null, startValue: defaultValue, changed: false };

    const slider = this._h('input', {
      type: 'range',
      min, max, step, value: defaultValue,
      onpointerdown: (e) => {
        if (this._suppressHistoryRecording) return;
        if (this.elapsed < 5 || !this.baselineMetrics || this.finished || !this.running) return;
        const val = step === '1' || step === 1 ? parseInt(slider.value) : parseFloat(slider.value);
        dragState.startValue = val;
        dragState.snapshot = {
          before: this._captureMetricsSnapshot(),
          frames: this.trafficSystem?.recordingFrames?.length || 0,
          time: this.elapsed,
          label
        };
        dragState.changed = false;
      },
      oninput: (e) => {
        const val = e.target.value;
        labelLine.querySelector('.slider-value').textContent = `${val}${unit}`;
        const parsed = step === '1' || step === 1 ? parseInt(val) : parseFloat(val);
        if (dragState.startValue !== parsed) dragState.changed = true;
        let partial = null;
        if (label.includes('周期')) partial = { cycleTime: parsed };
        else if (label.includes('南北绿')) partial = { nsGreenRatio: parsed / 100 };
        else if (label.includes('黄灯')) partial = { yellowDuration: parsed };
        if (partial) this._applyConfigOnly(partial);
      },
      onpointerup: () => {
        const finalVal = step === '1' || step === 1 ? parseInt(slider.value) : parseFloat(slider.value);
        dragState.changed = dragState.changed || (dragState.startValue !== finalVal);
        if (!dragState.changed || !dragState.snapshot) {
          dragState.snapshot = null;
          return;
        }
        const s = dragState.snapshot;
        dragState.snapshot = null;
        dragState.changed = false;
        let partial = null;
        if (label.includes('周期')) partial = { cycleTime: finalVal };
        else if (label.includes('南北绿')) partial = { nsGreenRatio: finalVal / 100 };
        else if (label.includes('黄灯')) partial = { yellowDuration: finalVal };
        if (partial) this._submitAdjustment(s.before, s.frames, s.time, partial);
      },
      onchange: () => {
        if (!dragState.changed || !dragState.snapshot) return;
        const finalVal = step === '1' || step === 1 ? parseInt(slider.value) : parseFloat(slider.value);
        const s = dragState.snapshot;
        dragState.snapshot = null;
        dragState.changed = false;
        let partial = null;
        if (label.includes('周期')) partial = { cycleTime: finalVal };
        else if (label.includes('南北绿')) partial = { nsGreenRatio: finalVal / 100 };
        else if (label.includes('黄灯')) partial = { yellowDuration: finalVal };
        if (partial) this._submitAdjustment(s.before, s.frames, s.time, partial);
      }
    });
    group.appendChild(labelLine);
    group.appendChild(slider);
    return group;
  }

  _applyConfigOnly(partial) {
    const light = this.trafficLights.find(l => l.id === this.selectedIntersection);
    if (light) light.setConfig(partial);
    if (partial.busPriorityEnabled !== undefined) {
      this.trafficLights.forEach(l => l.setConfig({ busPriorityEnabled: partial.busPriorityEnabled }));
    }
    if (partial.rightTurnOnRed !== undefined) {
      this.trafficLights.forEach(l => l.setConfig({ rightTurnOnRed: partial.rightTurnOnRed }));
    }
  }

  _toggleItem(label, defaultValue) {
    const item = this._createElement('div', 'toggle-item');
    const labelEl = this._createElement('div', 'toggle-label', label);
    const sw = this._h('div', {
      className: `switch ${defaultValue ? 'active' : ''}`,
      onclick: () => {
        const next = !sw.classList.contains('active');
        const suppress = this._suppressHistoryRecording;
        const elapsedOk = this.elapsed >= 5 && this.baselineMetrics && this.running && !this.finished;
        let snapshot = null;
        if (!suppress && elapsedOk) {
          snapshot = {
            before: this._captureMetricsSnapshot(),
            frames: this.trafficSystem?.recordingFrames?.length || 0,
            time: this.elapsed
          };
        }
        sw.classList.toggle('active', next);
        const partial = label.includes('公交') ? { busPriorityEnabled: next } : { rightTurnOnRed: next };
        this._applyConfigOnly(partial);
        this.audioManager.playClick();
        if (snapshot) this._submitAdjustment(snapshot.before, snapshot.frames, snapshot.time, partial);
      }
    });
    item.appendChild(labelEl);
    item.appendChild(sw);
    return item;
  }

  _submitAdjustment(before, frameStartRaw, timeStart, partial) {
    if (this._interactionTimer) {
      clearTimeout(this._interactionTimer);
      this._interactionTimer = null;
    }
    if (this._pendingTimeoutId) {
      clearTimeout(this._pendingTimeoutId);
      this._pendingTimeoutId = null;
    }
    if (this.pendingAdjustment) {
      const oldId = this.pendingAdjustment.id;
      this.adjustmentHistory = this.adjustmentHistory.filter(e => e.id !== oldId);
      this.pendingAdjustment = null;
    }

    const frameStart = Math.max(0, frameStartRaw - 120);
    const intName = this.levelData.intersections.find(i => i.id === this.selectedIntersection)?.name || '全局';
    const descParts = [];
    if (partial.cycleTime !== undefined) descParts.push(`周期${partial.cycleTime}s`);
    if (partial.nsGreenRatio !== undefined) descParts.push(`南北绿${Math.round(partial.nsGreenRatio * 100)}%`);
    if (partial.yellowDuration !== undefined) descParts.push(`黄灯${partial.yellowDuration}s`);
    if (partial.busPriorityEnabled !== undefined) descParts.push(`公交优先${partial.busPriorityEnabled ? '开' : '关'}`);
    if (partial.rightTurnOnRed !== undefined) descParts.push(`红灯右转${partial.rightTurnOnRed ? '开' : '关'}`);
    const adjustDesc = `${intName}：${descParts.join(' · ')}`;

    const pendingId = `adj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const curFNow = this.trafficSystem?.recordingFrames?.length || frameStartRaw;
    this.pendingAdjustment = { id: pendingId, desc: adjustDesc, before, frameStart, timeStart };
    this._addToHistory({
      id: pendingId, desc: adjustDesc,
      before, after: null, delta: null,
      frameStart, frameEnd: curFNow,
      timeStart, timeEnd: this.elapsed,
      pending: true
    });

    const delaySec = 8;
    const checkMs = delaySec * 1000 / Math.max(1, this.gameState.timeScale || 1);
    this._pendingTimeoutId = setTimeout(() => {
      this._pendingTimeoutId = null;
      if (!this.running || this.finished || !this.pendingAdjustment || this.pendingAdjustment.id !== pendingId) return;
      const after = this._captureMetricsSnapshot();
      const curF = this.trafficSystem?.recordingFrames?.length || curFNow;
      const delta = this._calcDelta(before, after);
      const entry = {
        id: pendingId, desc: adjustDesc,
        before, after, delta,
        frameStart, frameEnd: curF,
        timeStart, timeEnd: this.elapsed,
        pending: false
      };
      this.pendingAdjustment = null;
      this._replaceHistoryEntry(entry);
      this.baselineMetrics = after;
      this._showDeltaToast(delta, adjustDesc);
      this.audioManager.play(delta.congestion <= 0 && delta.avgSpeed >= 0 ? 'success' : 'warning', 0.4);
    }, checkMs);
  }

  _captureMetricsSnapshot() {
    const tm = this.trafficSystem?.getMetrics() || { congestionIndex: 0, averageSpeedKmh: 0, throughput: 0, stoppedCount: 0, totalVehicles: 0 };
    const bm = this.busSystem?.getMetrics() || { onTimeRate: 100, arrivals: 0, scheduled: 0 };
    return {
      congestion: tm.congestionIndex || 0,
      avgSpeed: tm.averageSpeedKmh || 0,
      busOnTime: bm.onTimeRate || 0,
      throughput: tm.throughput || 0,
      stoppedCount: tm.stoppedCount || 0,
      totalVehicles: tm.totalVehicles || 0,
      time: this.elapsed || 0
    };
  }

  _calcDelta(before, after) {
    return {
      congestion: +(after.congestion - before.congestion).toFixed(1),
      avgSpeed: +(after.avgSpeed - before.avgSpeed).toFixed(1),
      busOnTime: +(after.busOnTime - before.busOnTime).toFixed(1),
      throughput: +(after.throughput - before.throughput).toFixed(1)
    };
  }

  _showDeltaToast(delta, desc) {
    const parts = [];
    const cSign = delta.congestion <= 0 ? '✅' : '⚠️';
    parts.push(`拥堵 ${delta.congestion > 0 ? '+' : ''}${delta.congestion}%`);
    const sSign = delta.avgSpeed >= 0 ? '✅' : '⚠️';
    parts.push(`速度 ${delta.avgSpeed > 0 ? '+' : ''}${delta.avgSpeed}km/h`);
    const bSign = delta.busOnTime >= 0 ? '✅' : '⚠️';
    parts.push(`准点 ${delta.busOnTime > 0 ? '+' : ''}${delta.busOnTime}%`);
    this._showToast(`📊 ${desc} → ${parts.join(' | ')}`, delta.congestion <= -3 || delta.avgSpeed >= 2 ? 'success' : delta.congestion >= 5 ? 'error' : 'info', 5000);
  }

  _refreshSliders() {
    const light = this.trafficLights.find(l => l.id === this.selectedIntersection);
    if (!light) return;
    const cfg = light.getConfig();
    const sliders = document.querySelectorAll('.control-panel input[type="range"]');
    if (sliders.length >= 3) {
      this._suppressHistoryRecording = true;
      sliders[0].value = cfg.cycleTime;
      sliders[0].dispatchEvent(new Event('input'));
      sliders[1].value = cfg.nsGreenRatio * 100;
      sliders[1].dispatchEvent(new Event('input'));
      sliders[2].value = cfg.yellowDuration;
      sliders[2].dispatchEvent(new Event('input'));
      setTimeout(() => { this._suppressHistoryRecording = false; }, 50);
    }
  }

  _buildSimControls() {
    const container = this._createElement('div', 'sim-controls');

    const progress = this._createElement('div', 'progress-container');
    const label = this._h('div', { className: 'progress-label' }, [
      this._h('span', { id: 'progress-phase', textContent: '模拟进行中' }),
      this._h('span', { id: 'progress-percent', textContent: '0%' })
    ]);
    const barWrap = this._createElement('div', 'progress-bar');
    this.progressFill = this._createElement('div', 'progress-fill');
    barWrap.appendChild(this.progressFill);
    progress.appendChild(label);
    progress.appendChild(barWrap);

    const simBtns = this._createElement('div', 'sim-buttons');
    this.speedBadge = this._createElement('div', 'speed-badge', '1×');
    for (const sp of [1, 2, 3, 4, 5]) {
      const b = this._h('button', {
        className: 'icon-btn',
        textContent: `${sp}×`,
        style: { fontSize: '13px', width: '38px', height: '38px', fontWeight: '700' },
        title: `${sp}倍速度 (按 ${sp})`,
        onclick: () => {
          this.audioManager.playClick();
          this.eventBus.emit('game:speed', sp);
        }
      });
      simBtns.appendChild(b);
    }
    simBtns.insertBefore(this.speedBadge, simBtns.firstChild);

    container.appendChild(progress);
    container.appendChild(simBtns);
    this._mountUI(container);
  }

  _addToHistory(entry) {
    this.adjustmentHistory.push(entry);
    this._refreshHistoryUI();
  }

  _replaceHistoryEntry(entry) {
    const idx = this.adjustmentHistory.findIndex(e => e.id === entry.id);
    if (idx >= 0) this.adjustmentHistory[idx] = entry;
    else this.adjustmentHistory.push(entry);
    this._refreshHistoryUI();
  }

  _refreshHistoryUI() {
    if (!this._historyList) return;
    this._historyList.innerHTML = '';
    if (this.adjustmentHistory.length === 0) {
      const empty = this._createElement('div', 'history-empty', '调整信号灯或规则后，此处记录每次策略效果对比');
      empty.style.cssText = 'color:#7a8aa5;font-size:12px;padding:10px;text-align:center;line-height:1.6';
      this._historyList.appendChild(empty);
      return;
    }
    const list = [...this.adjustmentHistory].reverse();
    list.forEach((entry, idx) => {
      const item = this._createElement('div', 'history-item');
      item.style.cssText = 'padding:8px 10px;border-bottom:1px solid #2a3548;border-radius:4px;margin-bottom:4px;background:rgba(255,255,255,0.02)';
      const head = this._h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
        this._h('span', { style: { fontSize: '12px', fontWeight: '600', color: '#e0e8f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }, textContent: `${list.length - idx}. ${entry.desc}` }),
        this._h('span', { style: { fontSize: '10px', color: '#7a8aa5' }, textContent: `t=${Math.round(entry.timeStart)}s` })
      ]);
      item.appendChild(head);

      if (entry.pending) {
        const pending = this._createElement('div', '', '⏳ 正在评估效果...');
        pending.style.cssText = 'color:#ffa94d;font-size:11px;animation: pulse 1.2s infinite';
        item.appendChild(pending);
      } else if (entry.delta) {
        const deltaRow = this._h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' } });
        const d = entry.delta;
        const deltaCells = [
          { label: '拥堵', val: d.congestion, unit: '%', better: d.congestion <= 0 },
          { label: '速度', val: d.avgSpeed, unit: 'km/h', better: d.avgSpeed >= 0 },
          { label: '准点', val: d.busOnTime, unit: '%', better: d.busOnTime >= 0 },
          { label: '吞吐', val: d.throughput, unit: '/分', better: d.throughput >= 0 }
        ];
        deltaCells.forEach(c => {
          const sign = c.val > 0 ? '+' : '';
          const color = c.better ? '#49c77e' : c.val === 0 ? '#8a9ab5' : '#ff6b6b';
          const cell = this._h('span', {
            style: {
              fontSize: '11px', padding: '2px 6px', borderRadius: '3px',
              background: c.better ? 'rgba(73,199,126,0.12)' : c.val === 0 ? 'rgba(138,154,181,0.1)' : 'rgba(255,107,107,0.12)',
              color, fontWeight: '600', whiteSpace: 'nowrap'
            },
            textContent: `${c.label} ${sign}${c.val}${c.unit}`
          });
          deltaRow.appendChild(cell);
        });
        item.appendChild(deltaRow);

        const btnRow = this._h('div', { style: { display: 'flex', gap: '6px', justifyContent: 'flex-end' } });
        const replayBtn = this._h('button', {
          className: 'btn btn-small',
          style: { fontSize: '11px', padding: '3px 8px', background: 'rgba(79,140,255,0.2)', color: '#8ab4ff', border: '1px solid rgba(79,140,255,0.3)' },
          textContent: '🎬 回放片段',
          onclick: () => {
            this.audioManager.playClick();
            this._replayAdjustmentSegment(entry);
          }
        });
        const compareBtn = this._h('button', {
          className: 'btn btn-small',
          style: { fontSize: '11px', padding: '3px 8px', background: 'rgba(255,169,77,0.15)', color: '#ffc78a', border: '1px solid rgba(255,169,77,0.3)' },
          textContent: '📊 锁定对比',
          onclick: () => {
            this.audioManager.playClick();
            this.prevDisplay = {
              avgSpeed: entry.before.avgSpeed,
              congestion: entry.before.congestion,
              busOnTime: entry.before.busOnTime,
              throughput: entry.before.throughput
            };
            this._comparisonLocked = entry;
            if (this._lockLabel) this._lockLabel.textContent = `🔒 锁定：${entry.desc.slice(0, 22)}`;
            this._showToast('已锁定为对比基准', 'info', 2500);
          }
        });
        btnRow.appendChild(compareBtn);
        btnRow.appendChild(replayBtn);
        item.appendChild(btnRow);
      }
      this._historyList.appendChild(item);
    });
  }

  _buildAdjustmentHistoryPanel() {
    const panel = this._createElement('div', 'panel history-panel');
    panel.style.cssText = 'position:absolute;left:20px;bottom:110px;width:340px;max-height:280px;display:flex;flex-direction:column';
    const head = this._h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
      this._createElement('div', 'control-title', '� 策略调整历史'),
      (this._lockLabel = this._h('span', { style: { fontSize: '10px', color: '#ffa94d' }, textContent: '' }))
    ]);
    panel.appendChild(head);
    this._historyList = this._createElement('div', 'history-list');
    this._historyList.style.cssText = 'overflow-y:auto;flex:1;padding-right:2px;max-height:230px';
    panel.appendChild(this._historyList);
    this._mountUI(panel);
    this._refreshHistoryUI();
  }

  _replayAdjustmentSegment(entry) {
    if (!this.trafficSystem) return;
    const recording = this.trafficSystem.getRecording();
    if (!recording || recording.length < 30) {
      this._showToast('⚠️ 录制数据不足（请先模拟 10+ 秒）', 'warning');
      return;
    }
    const startF = Math.max(0, entry.frameStart);
    const extraTail = Math.min(recording.length - 1, (entry.frameEnd || recording.length - 1) + 480);
    const endF = Math.min(recording.length - 1, Math.max(extraTail, entry.frameEnd + 180));
    if (endF - startF < 30 || startF >= recording.length || endF <= startF) {
      this._showToast('⚠️ 调整片段录制中，请稍后再试', 'warning');
      return;
    }
    const seg = recording.slice(startF, endF + 1);
    this.replaySystem.stop();
    this.replaySystem.loadRecording(seg);
    this.replaySystem.play({
      speed: Math.max(1, (this.gameState.speed || 1) * 1.0),
      onUpdate: (p) => {
        const pc = document.getElementById('progress-percent');
        if (pc) pc.textContent = `策略回放 ${Math.floor(p.progress * 100)}%`;
      },
      onComplete: () => {
        this._showToast('✅ 策略回放完成', 'success');
        const pp = document.getElementById('progress-phase');
        if (pp) pp.textContent = '模拟进行中';
      }
    });
    const pp = document.getElementById('progress-phase');
    if (pp) pp.textContent = '策略片段回放中...';
    const durSec = Math.round((endF - startF) / 60);
    this._showToast(`🎬 回放调整前后片段（${durSec}秒，含调整前2s + 调整后效果）`, 'info', 3500);
  }

  _buildComparisonPanel() {
    const panel = this._createElement('div', 'panel comparison-panel');
    panel.style.cssText = 'position:absolute;right:20px;top:80px;width:320px';
    const title = this._createElement('div', 'control-title', '📈 实时指标对比');

    const labels = {
      avgSpeed: '平均速度(km/h)',
      congestion: '拥堵指数(%)',
      busOnTime: '公交准点率(%)',
      throughput: '车辆吞吐(/分)'
    };

    this.prevDisplay = this.comparisonMetrics || null;
    const keys = ['avgSpeed', 'congestion', 'busOnTime', 'throughput'];
    const chart = this._createElement('div', 'chart-container');
    const barsWrap = this._createElement('div', 'chart-bars');
    this.chartBarWraps = {};

    keys.forEach((k) => {
      const group = this._createElement('div', 'chart-bar-group');
      const valRow = this._h('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '4px', minHeight: '20px' } });
      const val = this._h('div', { className: 'chart-bar-value', style: { fontSize: '13px' }, textContent: '--' });
      const deltaTag = this._h('span', { style: { fontSize: '10px', fontWeight: '700' }, textContent: '' });
      valRow.appendChild(val);
      valRow.appendChild(deltaTag);
      const bar1 = this._createElement('div', 'chart-bar');
      bar1.style.height = '0%';
      const bar2 = this._createElement('div', 'chart-bar comparison');
      bar2.style.height = '0%';
      const lab = this._createElement('div', 'chart-bar-label', labels[k]);
      group.appendChild(valRow);
      group.appendChild(bar1);
      group.appendChild(bar2);
      group.appendChild(lab);
      barsWrap.appendChild(group);
      this.chartBarWraps[k] = { group, val, deltaTag, bar1, bar2, lab };
    });

    chart.appendChild(barsWrap);
    const legend = this._h('div', { style: { display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '12px', color: '#8a9ab5', marginTop: '6px', flexWrap: 'wrap' } }, [
      this._h('span', { textContent: '■ 当前', style: { color: '#4f8cff' } }),
      this._h('span', { textContent: '■ 基线(调整前/上次)', style: { color: '#ffa94d' } })
    ]);
    const hint = this._h('div', { style: { marginTop: '6px', fontSize: '10px', color: '#7a8aa5', textAlign: 'center', lineHeight: '1.5' } }, [
      this._h('span', { textContent: '提示：在策略调整历史点"锁定对比"可固定基线 · 绿色Δ=改善 / 红色Δ=恶化' })
    ]);

    panel.appendChild(title);
    panel.appendChild(chart);
    panel.appendChild(legend);
    panel.appendChild(hint);
    this._mountUI(panel);
  }

  _updateComparison(current) {
    if (!this.chartBarWraps) return;
    const c = current;
    const baseline = this.baselineMetrics;
    if (!baseline && !this.prevDisplay) return;

    const compareBase = this.prevDisplay || {
      avgSpeed: baseline.avgSpeed || 0,
      congestion: baseline.congestion || 0,
      busOnTime: baseline.busOnTime || 0,
      throughput: baseline.throughput || 0
    };

    const currentVals = {
      avgSpeed: c.averageSpeedKmh || 0,
      congestion: c.congestionIndex || 0,
      busOnTime: c.busOnTimeRate || 0,
      throughput: c.throughput || 0
    };

    const pairs = [
      { k: 'avgSpeed', a: currentVals.avgSpeed, b: compareBase.avgSpeed || 0, max: 50, unit: 'km/h', better: (a, b) => a >= b },
      { k: 'congestion', a: currentVals.congestion, b: compareBase.congestion || 0, max: 100, unit: '%', better: (a, b) => a <= b },
      { k: 'busOnTime', a: currentVals.busOnTime, b: compareBase.busOnTime || 0, max: 100, unit: '%', better: (a, b) => a >= b },
      { k: 'throughput', a: currentVals.throughput, b: compareBase.throughput || 0, max: 40, unit: '/分', better: (a, b) => a >= b }
    ];

    pairs.forEach(({ k, a, b, max, unit, better }) => {
      const w = this.chartBarWraps[k];
      if (!w) return;
      const h1 = Math.max(5, Math.min(100, (a / max) * 100));
      const h2 = Math.max(5, Math.min(100, ((b || 0) / max) * 100));
      w.bar1.style.height = `${h1}%`;
      w.bar2.style.height = `${h2}%`;
      w.val.textContent = `${a.toFixed(1)}`;
      const delta = a - b;
      const sign = delta > 0 ? '+' : '';
      const isBetter = better(a, b);
      const dColor = Math.abs(delta) < 0.05 ? '#8a9ab5' : isBetter ? '#49c77e' : '#ff6b6b';
      w.deltaTag.style.color = dColor;
      w.deltaTag.textContent = Math.abs(delta) < 0.05 ? '' : `${sign}${delta.toFixed(1)}${unit}`;
    });
  }

  _showLevelTutorial() {
    const hints = this.levelData.tutorialHints || [];
    if (hints.length === 0) return;

    const overlay = this._createElement('div', 'modal-overlay');
    const modal = this._createElement('div', 'panel modal');
    const title = this._h('h2', { textContent: `🎯 ${this.levelData.name} - 关卡提示` });
    const body = this._h('div', { className: 'modal-body' });

    hints.forEach((h, i) => {
      const step = this._h('div', { className: 'tutorial-step' }, [
        this._h('div', { className: 'tutorial-icon', textContent: String(i + 1) }),
        this._h('p', { textContent: h, style: { flex: 1, alignSelf: 'center' } })
      ]);
      body.appendChild(step);
    });

    const footer = this._h('div', { className: 'modal-footer' }, [
      this._h('button', {
        className: 'btn btn-success',
        textContent: '开始模拟 ▶',
        onclick: () => {
          this.audioManager.playClick();
          this._removeOverlay(overlay);
        }
      })
    ]);

    modal.appendChild(title);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    this._mountUI(overlay);
  }

  _removeOverlay(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  _confirmQuit() {
    const overlay = this._createElement('div', 'modal-overlay');
    const modal = this._createElement('div', 'panel modal');
    const title = this._h('h2', { textContent: '⏹ 确认退出？' });
    const body = this._h('div', { className: 'modal-body' }, [
      this._h('p', { textContent: '退出后当前进度将不会被保存。确定要返回菜单吗？', style: { lineHeight: '1.7' } })
    ]);
    const footer = this._h('div', { className: 'modal-footer' }, [
      this._h('button', {
        className: 'btn btn-secondary',
        textContent: '取消',
        onclick: () => {
          this.audioManager.playClick();
          this._removeOverlay(overlay);
        }
      }),
      this._h('button', {
        className: 'btn btn-danger',
        textContent: '退出到菜单',
        onclick: () => {
          this.audioManager.playClick();
          this._cleanupScene();
          this.sceneManager.changeTo(SCENES.MENU);
        }
      })
    ]);

    modal.appendChild(title);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    this._mountUI(overlay);
  }

  _startReplay() {
    if (!this.trafficSystem) return;
    const recording = this.trafficSystem.getRecording();
    if (!recording || recording.length < 30) {
      this._showToast('⚠️ 数据不足，请先模拟一段时间', 'warning');
      return;
    }
    this.replaySystem.stop();
    this.replaySystem.loadRecording(recording);
    this.replaySystem.play({
      speed: this.gameState.speed || 1,
      onUpdate: (p) => {
        const pc = document.getElementById('progress-percent');
        if (pc) pc.textContent = `回放 ${Math.floor(p.progress * 100)}%`;
      },
      onComplete: () => {
        this._showToast('✅ 回放完成', 'success');
        const pp = document.getElementById('progress-phase');
        if (pp) pp.textContent = '模拟进行中';
      }
    });
    const pp = document.getElementById('progress-phase');
    if (pp) pp.textContent = '回放中...';
    this._showToast('🎬 开始回放最后一段', 'info');
  }

  _bindEvents() {
    this._onPause = () => {
      if (this.gameState.isPaused) {
        this.eventBus.emit('game:paused');
        this._showToast('⏸ 已暂停', 'info');
      } else {
        this.eventBus.emit('game:resumed');
        this._showToast('▶ 继续', 'info');
      }
    };
    this._onSpeed = (s) => {
      this.gameState.speed = s;
      this.gameState.timeScale = s;
      if (this.speedBadge) this.speedBadge.textContent = `${s}×`;
    };
    this._onEscape = () => this._confirmQuit();

    this.eventBus.on('game:pauseToggled', this._onPause);
    this.eventBus.on('game:speedChanged', this._onSpeed);
    this.eventBus.on('input:action:replay', () => this._startReplay());
    this.eventBus.on('game:escapePressed', this._onEscape);

    this._prevPaused = this.gameState.isPaused;
  }

  _unbindEvents() {
    super._unbindEvents();
    if (this._onPause) this.eventBus.off('game:pauseToggled', this._onPause);
    if (this._onSpeed) this.eventBus.off('game:speedChanged', this._onSpeed);
    if (this._onEscape) this.eventBus.off('game:escapePressed', this._onEscape);
  }

  _onUpdate({ dt }) {
    if (!this.running || !this.trafficSystem) return;
    const scaled = this.gameState.isPaused ? 0 : dt * (this.gameState.timeScale || 1);
    if (scaled <= 0) return;

    this.elapsed += scaled;
    for (const light of this.trafficLights) light.update(scaled);
    this.trafficSystem.update(scaled);
    this.busSystem.update(scaled);

    const trafficMetrics = this.trafficSystem.getMetrics();
    const busMetrics = this.busSystem.getMetrics();
    this.scoreSystem.update(trafficMetrics, busMetrics, this.elapsed);

    const timeLeft = Math.max(0, this.levelData.duration - this.elapsed);
    const tPct = Math.min(100, (this.elapsed / this.levelData.duration) * 100);

    if (this.hudTime) {
      this.hudTime.valEl.textContent = `${Math.ceil(timeLeft)}s`;
      this.hudTime.valEl.className = `hud-stat-value ${timeLeft < 20 ? 'warn' : ''}`;
    }
    const congestion = trafficMetrics.congestionIndex;
    if (this.hudCongestion) {
      this.hudCongestion.valEl.textContent = `${congestion.toFixed(0)}%`;
      this.hudCongestion.valEl.className = `hud-stat-value ${congestion < 35 ? 'good' : congestion < 65 ? 'warn' : 'bad'}`;
    }
    if (this.hudAvgSpeed) {
      const s = trafficMetrics.averageSpeedKmh;
      this.hudAvgSpeed.valEl.textContent = `${s.toFixed(1)} km/h`;
      this.hudAvgSpeed.valEl.className = `hud-stat-value ${s > 25 ? 'good' : s > 15 ? 'warn' : 'bad'}`;
    }
    if (this.hudBus) {
      const b = busMetrics.onTimeRate;
      this.hudBus.valEl.textContent = `${b.toFixed(0)}%`;
      this.hudBus.valEl.className = `hud-stat-value ${b > 85 ? 'good' : b > 70 ? 'warn' : 'bad'}`;
    }

    if (this.progressFill) {
      let fillCls = '';
      const st = this.scoreSystem.getCurrentStatus();
      if (st.isCritical) fillCls = 'bad';
      else if (st.willFailSoon) fillCls = 'warn';
      else if (tPct > 80) fillCls = 'good';
      this.progressFill.className = `progress-fill ${fillCls}`;
      this.progressFill.style.width = `${tPct}%`;
    }

    const pp = document.getElementById('progress-percent');
    if (pp && !this.replaySystem?.isPlaying) pp.textContent = `${Math.floor(tPct)}%`;
    const phase = document.getElementById('progress-phase');
    if (phase && !this.replaySystem?.isPlaying) {
      const peak = trafficMetrics.peakStatus;
      if (peak.active) {
        const icon = peak.type === 'morning' ? '🌅' : '🌇';
        phase.textContent = `${icon} ${peak.type === 'morning' ? '早' : '晚'}高峰 (${(peak.intensity * 100).toFixed(0)}%)`;
      } else {
        phase.textContent = '模拟进行中';
      }
    }

    if (this.chartBarWraps) {
      this._updateComparison({
        ...trafficMetrics,
        busOnTimeRate: busMetrics.onTimeRate
      });
    }

    const status = this.scoreSystem.getCurrentStatus();
    if (status.willFailSoon && !this._warnedFail) {
      this._warnedFail = true;
      this._showToast('⚠️ 拥堵即将失控！立即调整信号灯', 'warning');
      this.audioManager.play('warning', 0.5);
    }
    if (status.failProgress < 0.3) this._warnedFail = false;

    this.lastMetrics = {
      ...trafficMetrics,
      busOnTime: busMetrics.onTimeRate,
      busCount: busMetrics.arrivals,
      historyLen: this.scoreSystem.metrics?.length || 0
    };

    if (this.scoreSystem.hasFailed() && !this.finished) {
      this._finishGame(false, 'failed');
      return;
    }
    if (this.elapsed >= this.levelData.duration && !this.finished) {
      this._finishGame(true, 'complete');
    }
  }

  _finishGame(completed, reason) {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    this.trafficSystem.stop();

    const trafficMetrics = this.trafficSystem.getMetrics();
    const busMetrics = this.busSystem.getMetrics();
    const result = this.scoreSystem.calculateResult(trafficMetrics, busMetrics);

    if (result.success && !this.isSandbox) {
      this.saveSystem.completeLevel(
        this.levelId,
        result.stars,
        result.overallScore,
        {
          avgSpeed: result.breakdown.speed.value,
          congestion: result.breakdown.congestion.value,
          busOnTime: result.breakdown.bus.value,
          throughput: result.breakdown.throughput.value
        }
      );
      this.audioManager.playVictoryJingle();
    } else if (!result.success) {
      this.audioManager.playFailureSound();
    } else {
      this.audioManager.play('success');
    }

    setTimeout(() => {
      this._cleanupScene();
      this.sceneManager.changeTo(SCENES.RESULT, {
        levelId: this.levelId,
        result,
        reason,
        levelData: this.levelData,
        isSandbox: this.isSandbox
      });
    }, 800);
  }

  _cleanupScene() {
    if (this.trafficSystem) this.trafficSystem.dispose();
    if (this.busSystem) this.busSystem.dispose();
    if (this.roadNetwork) this.roadNetwork.dispose();
    for (const light of this.trafficLights) light.dispose();
    if (this.replaySystem) this.replaySystem.dispose();
    this.trafficSystem = null;
    this.busSystem = null;
    this.roadNetwork = null;
    this.trafficLights = [];
    this.replaySystem = null;
    this.renderEngine.clear();
  }

  async onExit() {
    super.onExit();
    this._cleanupScene();
  }
}
