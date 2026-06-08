import { BaseScene } from './BaseScene.js';
import { SCENES } from '../core/SceneManager.js';
import { saveSystem } from '../core/SaveSystem.js';

export class ResultScene extends BaseScene {
  _setupUI(params) {
    this.levelId = params.levelId;
    this.result = params.result;
    this.reason = params.reason;
    this.levelData = params.levelData;
    this.isSandbox = params.isSandbox;

    const screen = this._createElement('div', 'result-screen');

    const titleText = this.result.success ? '关卡通过！' : '模拟失败';
    const titleCls = this.result.success ? 'success' : 'fail';

    const title = this._h('h1', {
      className: 'result-title ' + titleCls,
      textContent: titleText
    });

    const stars = this._h('div', { className: 'result-stars' });
    let starChars = '';
    for (let i = 0; i < 3; i++) {
      starChars += i < this.result.stars ? '★' : '☆';
    }
    stars.textContent = starChars;

    const panel = this._createElement('div', 'panel result-panel');
    this._buildScorePanel(panel);
    this._buildStats(panel);
    this._buildReasons(panel);
    this._buildNextGoal(panel);

    screen.appendChild(title);
    screen.appendChild(stars);
    screen.appendChild(panel);
    this._buildActions(screen);

    this._mountUI(screen);
  }

  _buildScorePanel(panel) {
    const scoreLine = this._createElement('div');
    scoreLine.style.marginBottom = '20px';
    scoreLine.style.textAlign = 'center';

    const label = this._createElement('div');
    label.style.fontSize = '13px';
    label.style.color = '#8a9ab5';
    label.style.marginBottom = '4px';
    label.textContent = '综合评分';

    const value = this._createElement('div');
    value.style.fontSize = '40px';
    value.style.fontWeight = '800';
    value.style.color = this.result.success ? '#7ee8fa' : '#ff6b6b';
    value.textContent = this.result.overallScore + '分';

    scoreLine.appendChild(label);
    scoreLine.appendChild(value);
    panel.appendChild(scoreLine);
  }

  _buildStats(panel) {
    const bd = this.result.breakdown;
    const items = [
      { label: bd.speed, key: 'speed' },
      { label: bd.congestion, key: 'congestion' },
      { label: bd.bus, key: 'bus' },
      { label: bd.throughput, key: 'throughput' }
    ];

    items.forEach((item) => {
      const s = item.label;
      const value = s.value;
      const displayValue = value.toFixed(s.value > 10 ? 0 : 1) + (s.unit || '');
      let compareInfo = null;

      if (s.target !== undefined && item.key !== 'throughput') {
        const diff = s.lowerBetter ? (s.target - value) : (value - s.target);
        const good = diff >= 0;
        compareInfo = this._h('span', {
          className: 'result-stat-change ' + (good ? 'up' : 'down'),
          textContent: (good ? '▲ ' : '▼ ') + Math.abs(diff).toFixed(1) + (s.unit || '') + (good ? ' 达标' : '')
        });
      }

      const labelSpan = this._h('span', { className: 'result-stat-label' }, s.label);
      const valueDiv = this._createElement('div');
      valueDiv.appendChild(this._h('span', { className: 'result-stat-value' }, displayValue));
      if (compareInfo) valueDiv.appendChild(compareInfo);

      const stat = this._createElement('div', 'result-stat');
      stat.appendChild(labelSpan);
      stat.appendChild(valueDiv);
      panel.appendChild(stat);
    });

    const v = this.result.vehicles;
    const vehLabel = this._h('span', { className: 'result-stat-label' }, '车辆统计');
    const vehValue = this._h('span', { className: 'result-stat-value' });
    const pct = (v.arrived / Math.max(1, v.spawned) * 100).toFixed(0);
    vehValue.textContent = v.arrived + ' / ' + v.spawned + ' 辆到达 (' + pct + '%)';
    const vehStat = this._createElement('div', 'result-stat');
    vehStat.appendChild(vehLabel);
    vehStat.appendChild(vehValue);
    panel.appendChild(vehStat);
  }

  _buildReasons(panel) {
    if (!this.result.reasons || this.result.reasons.length === 0) return;
    const color = this.result.success ? '#49c77e' : '#ff6b6b';
    const titleLabel = this.result.success ? '成功原因' : '失败原因';
    const icon = this.result.success ? '✅ ' : '❌ ';

    let reasonsHtml = '';
    this.result.reasons.forEach((r) => {
      reasonsHtml += '<div style="padding: 4px 0; border-left: 3px solid ' + color + '; padding-left: 10px; margin: 6px 0;">• ' + r + '</div>';
    });

    const title = this._createElement('div', 'reason-title');
    title.textContent = icon + titleLabel;

    const content = this._createElement('div', 'reason-text');
    content.innerHTML = reasonsHtml;

    const box = this._createElement('div', 'reason-box');
    box.appendChild(title);
    box.appendChild(content);
    panel.appendChild(box);
  }

  _buildNextGoal(panel) {
    if (!this.result.nextGoal) return;

    const title = this._createElement('div', 'next-goal-title');
    title.textContent = '🎯 下一步目标';

    const content = this._createElement('div', 'next-goal-text');
    content.textContent = this.result.nextGoal;

    const box = this._createElement('div', 'next-goal');
    box.appendChild(title);
    box.appendChild(content);
    panel.appendChild(box);
  }

  _buildActions(screen) {
    const actions = this._createElement('div', 'result-actions');

    const retryBtn = this._h('button', {
      className: 'btn',
      textContent: '🔄 再次挑战',
      onclick: () => {
        this.audioManager.playClick();
        this.sceneManager.changeTo(SCENES.GAME, {
          levelId: this.levelId,
          comparisonMetrics: this._makeComparison(),
          prevResult: this.result,
          skippedTutorial: true
        });
      }
    });

    if (this.result.success && !this.isSandbox) {
      const nextId = saveSystem.getNextLevelId(this.levelId);
      if (nextId && saveSystem.isLevelUnlocked(nextId)) {
        const nextBtn = this._h('button', {
          className: 'btn btn-success',
          textContent: '➡️ 下一关',
          onclick: () => {
            this.audioManager.playClick();
            this.sceneManager.changeTo(SCENES.GAME, { levelId: nextId });
          }
        });
        actions.appendChild(nextBtn);
      }
    }

    const menuBtn = this._h('button', {
      className: 'btn btn-secondary',
      textContent: '🏠 返回菜单',
      onclick: () => {
        this.audioManager.playClick();
        this.sceneManager.changeTo(SCENES.MENU);
      }
    });

    actions.appendChild(retryBtn);
    actions.appendChild(menuBtn);
    screen.appendChild(actions);
  }

  _makeComparison() {
    const bd = this.result.breakdown;
    return {
      avgSpeed: bd.speed.value,
      congestion: bd.congestion.value,
      busOnTime: bd.bus.value,
      throughput: bd.throughput.value
    };
  }
}
