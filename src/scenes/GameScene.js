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
    this._buildScene();
    this._buildHUD();
    this._buildControlPanel();
    this._buildSimControls();
    if (this.comparisonMetrics) {
      this._buildComparisonPanel();
    }
    if (this.levelData.tutorialHints?.length && !params.skippedTutorial) {
      setTimeout(() => this._showLevelTutorial(), 500);
    }
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
    const groupCycle = this._sliderGroup('信号灯周期', 60, 30, 120, 1, '秒',
      (v) => this._updateConfig({ cycleTime: parseInt(v) }));
    const groupRatio = this._sliderGroup('南北绿灯占比', 50, 20, 75, 1, '%',
      (v) => this._updateConfig({ nsGreenRatio: parseInt(v) / 100 }));
    const groupYellow = this._sliderGroup('黄灯时间', 3, 2, 6, 1, '秒',
      (v) => this._updateConfig({ yellowDuration: parseInt(v) }));

    const title2 = this._createElement('div', 'control-title', '⚙️ 规则设置');
    const toggleGroup = this._createElement('div', 'toggle-group');

    const toggleBus = this._toggleItem('🚌 公交优先', false,
      (v) => this._updateConfig({ busPriorityEnabled: v }));
    const toggleTurn = this._toggleItem('↪️ 红灯允许右转', true,
      (v) => this._updateConfig({ rightTurnOnRed: v }));

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

  _sliderGroup(label, defaultValue, min, max, step, unit, onChange) {
    const key = label;
    const group = this._h('div', { className: 'slider-group', dataset: { key } });
    const labelLine = this._h('div', { className: 'slider-label' }, [
      this._h('span', { textContent: label }),
      this._h('span', { className: 'slider-value', textContent: `${defaultValue}${unit}` })
    ]);
    const slider = this._h('input', {
      type: 'range',
      min, max, step, value: defaultValue,
      oninput: (e) => {
        const val = e.target.value;
        labelLine.querySelector('.slider-value').textContent = `${val}${unit}`;
        onChange(val);
      }
    });
    group.appendChild(labelLine);
    group.appendChild(slider);
    return group;
  }

  _toggleItem(label, defaultValue, onChange) {
    const item = this._createElement('div', 'toggle-item');
    const labelEl = this._createElement('div', 'toggle-label', label);
    const sw = this._h('div', {
      className: `switch ${defaultValue ? 'active' : ''}`,
      onclick: () => {
        const next = !sw.classList.contains('active');
        sw.classList.toggle('active', next);
        onChange(next);
        this.audioManager.playClick();
      }
    });
    item.appendChild(labelEl);
    item.appendChild(sw);
    return item;
  }

  _updateConfig(partial) {
    const light = this.trafficLights.find(l => l.id === this.selectedIntersection);
    if (light) light.setConfig(partial);
    if (partial.busPriorityEnabled !== undefined) {
      this.trafficLights.forEach(l => l.setConfig({ busPriorityEnabled: partial.busPriorityEnabled }));
    }
    if (partial.rightTurnOnRed !== undefined) {
      this.trafficLights.forEach(l => l.setConfig({ rightTurnOnRed: partial.rightTurnOnRed }));
    }
  }

  _refreshSliders() {
    const light = this.trafficLights.find(l => l.id === this.selectedIntersection);
    if (!light) return;
    const cfg = light.getConfig();
    const sliders = document.querySelectorAll('.control-panel input[type="range"]');
    if (sliders.length >= 3) {
      sliders[0].value = cfg.cycleTime;
      sliders[0].dispatchEvent(new Event('input'));
      sliders[1].value = cfg.nsGreenRatio * 100;
      sliders[1].dispatchEvent(new Event('input'));
      sliders[2].value = cfg.yellowDuration;
      sliders[2].dispatchEvent(new Event('input'));
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

  _buildComparisonPanel() {
    const panel = this._createElement('div', 'panel comparison-panel');
    const title = this._createElement('div', 'control-title', '📈 本次 vs 上次');

    const labels = {
      avgSpeed: '平均速度(km/h)',
      congestion: '拥堵指数(%)',
      busOnTime: '公交准点率(%)',
      throughput: '车辆吞吐(/分)'
    };

    this.prevDisplay = this.comparisonMetrics;
    const keys = ['avgSpeed', 'congestion', 'busOnTime', 'throughput'];
    const chart = this._createElement('div', 'chart-container');
    const barsWrap = this._createElement('div', 'chart-bars');
    this.chartBarWraps = {};

    keys.forEach((k) => {
      const group = this._createElement('div', 'chart-bar-group');
      const val = this._createElement('div', 'chart-bar-value', '--');
      const bar1 = this._createElement('div', 'chart-bar');
      bar1.style.height = '0%';
      const bar2 = this._createElement('div', 'chart-bar comparison');
      bar2.style.height = '0%';
      const lab = this._createElement('div', 'chart-bar-label', labels[k]);
      group.appendChild(val);
      group.appendChild(bar1);
      group.appendChild(bar2);
      group.appendChild(lab);
      barsWrap.appendChild(group);
      this.chartBarWraps[k] = { group, val, bar1, bar2, lab };
    });

    chart.appendChild(barsWrap);
    const legend = this._h('div', { style: { display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '12px', color: '#8a9ab5', marginTop: '4px' } }, [
      this._h('span', { textContent: '■ 当前' }, [this._h('span', { style: { color: '#4f8cff' }, textContent: '' })]),
      this._h('span', { textContent: '■ 上次' }, [this._h('span', { style: { color: '#ffa94d' }, textContent: '' })])
    ]);

    panel.appendChild(title);
    panel.appendChild(chart);
    panel.appendChild(legend);
    this._mountUI(panel);
  }

  _updateComparison(current) {
    if (!this.chartBarWraps || !this.prevDisplay) return;
    const c = current;
    const p = this.prevDisplay;

    const pairs = [
      { k: 'avgSpeed', a: c.averageSpeedKmh || 0, b: p.avgSpeed || 0, max: 50 },
      { k: 'congestion', a: c.congestionIndex || 0, b: p.congestion || 0, max: 100, reverse: true },
      { k: 'busOnTime', a: c.busOnTimeRate || 0, b: p.busOnTime || 0, max: 100 },
      { k: 'throughput', a: c.throughput || 0, b: p.throughput || 0, max: 40 }
    ];

    pairs.forEach(({ k, a, b, max, reverse }) => {
      const w = this.chartBarWraps[k];
      if (!w) return;
      const h1 = Math.max(5, Math.min(100, (a / max) * 100));
      const h2 = Math.max(5, Math.min(100, (b / max) * 100));
      w.bar1.style.height = `${h1}%`;
      w.bar2.style.height = `${h2}%`;
      w.val.textContent = `${a.toFixed(1)}`;
      if (reverse) {
        w.bar1.style.opacity = a < b ? '1' : '0.85';
      }
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
