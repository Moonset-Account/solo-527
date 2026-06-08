import { GameScene } from './GameScene.js';
import { SCENES } from '../core/SceneManager.js';
import { getLevel } from '../data/levels.js';
import { RoadNetwork } from '../game/RoadNetwork.js';
import { TrafficLight } from '../game/TrafficLight.js';
import { TrafficSystem } from '../game/TrafficSystem.js';
import { BusSystem } from '../game/BusSystem.js';
import { ScoreSystem } from '../game/ScoreSystem.js';
import { ReplaySystem } from '../game/ReplaySystem.js';

const SANDBOX_LEVELS = ['level_1', 'level_3', 'level_5'];

export class SandboxScene extends GameScene {
  _setupUI(params) {
    this.presetLevels = SANDBOX_LEVELS;
    this.currentPresetIdx = 1;
    this._showPresetSelector();
  }

  _showPresetSelector() {
    const overlay = this._createElement('div', 'modal-overlay');
    const modal = this._createElement('div', 'panel modal');

    const title = this._createElement('h2');
    title.textContent = '沙盒模式';

    const desc = this._createElement('div', 'modal-body');
    const p1 = this._createElement('p');
    p1.style.lineHeight = '1.7';
    p1.style.marginBottom = '16px';
    p1.textContent = '沙盒模式下，你可以自由测试任何参数组合。没有星级压力，尽情探索最优解！所有数据会被存档。';
    const h3 = this._createElement('h3');
    h3.style.color = '#7ee8fa';
    h3.style.marginBottom = '12px';
    h3.textContent = '选择地图规模：';
    desc.appendChild(p1);
    desc.appendChild(h3);

    const maps = this._createElement('div', 'level-grid');

    SANDBOX_LEVELS.forEach((id, idx) => {
      const lvl = getLevel(id);
      if (!lvl) return;
      const card = this._createElement('div', 'level-card');
      const cname = this._createElement('h3');
      cname.textContent = lvl.name;
      const cdesc = this._createElement('div', 'level-desc');
      cdesc.textContent = lvl.description;
      const cstar = this._createElement('div');
      cstar.style.fontSize = '13px';
      cstar.style.color = '#ffa94d';
      cstar.style.letterSpacing = '2px';
      cstar.textContent = '★'.repeat(lvl.difficulty) + '☆'.repeat(5 - lvl.difficulty);
      card.appendChild(cname);
      card.appendChild(cdesc);
      card.appendChild(cstar);

      card.addEventListener('click', () => {
        this.audioManager.playClick();
        this._removeOverlay(overlay);
        this._startSandboxWithLevel(id);
      });
      maps.appendChild(card);
    });

    modal.appendChild(title);
    modal.appendChild(desc);
    modal.appendChild(maps);

    const footer = this._createElement('div', 'modal-footer');
    const backBtn = this._createElement('button', 'btn btn-secondary');
    backBtn.textContent = '← 返回菜单';
    backBtn.addEventListener('click', () => {
      this.audioManager.playClick();
      this.sceneManager.changeTo(SCENES.MENU);
    });
    footer.appendChild(backBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    this._mountUI(overlay);
  }

  _removeOverlay(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  _startSandboxWithLevel(levelId) {
    const levelData = getLevel(levelId);
    if (!levelData) return;

    const sandboxLevel = JSON.parse(JSON.stringify(levelData));
    sandboxLevel.duration = Math.max(levelData.duration, 300);
    sandboxLevel.failCondition.maxCongestion = 100;
    sandboxLevel.failCondition.duration = 9999;
    sandboxLevel.isSandboxLevel = true;
    sandboxLevel.trafficConfig.baseSpawnRate *= 1.1;

    this._sandboxLevelData = sandboxLevel;
    this.levelId = levelId;
    this.levelData = sandboxLevel;
    this.isSandbox = true;
    this.elapsed = 0;
    this.running = true;
    this.finished = false;
    this.lastMetrics = null;
    this.trafficLights = [];
    this.selectedIntersection = sandboxLevel.intersections[0].id;

    const save = this.saveSystem.load();
    this.comparisonMetrics = save.sandbox.bestMetrics;
    this.prevResult = null;

    this._buildScene();
    this.scoreSystem = new ScoreSystem(this.levelData);
    this._buildHUD();
    this._buildControlPanel();
    this._buildSimControls();
    this._buildExtraButtons();
    if (this.comparisonMetrics) {
      this._buildComparisonPanel();
    }
    setTimeout(() => this._showSandboxBadge(), 100);
  }

  _buildScene() {
    const lvlData = this._sandboxLevelData || this.levelData;
    this.levelData = lvlData;
    this.roadNetwork = new RoadNetwork(this.renderEngine.scene, lvlData);
    for (let i = 0; i < lvlData.intersections.length; i++) {
      const int = lvlData.intersections[i];
      const light = new TrafficLight(this.renderEngine.scene, int, {
        cycleTime: 60,
        nsGreenRatio: 0.5,
        busPriorityEnabled: true
      });
      this.trafficLights.push(light);
    }
    this.trafficSystem = new TrafficSystem(
      this.renderEngine.scene, this.roadNetwork, this.trafficLights, lvlData
    );
    this.busSystem = new BusSystem(
      this.renderEngine.scene, this.roadNetwork, this.trafficLights, lvlData
    );
    this.replaySystem = new ReplaySystem(this.renderEngine.scene);
    this.trafficSystem.start();
  }

  _showSandboxBadge() {
    const badge = this._createElement('div', 'sandbox-badge');
    badge.textContent = '🧪 SANDBOX 模式 · 自由测试';
    this._mountUI(badge);
  }

  _finishGame(completed, reason) {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    this.trafficSystem.stop();

    const trafficMetrics = this.trafficSystem.getMetrics();
    const busMetrics = this.busSystem.getMetrics();
    const result = this.scoreSystem.calculateResult(trafficMetrics, busMetrics);

    const params = {};
    for (let i = 0; i < this.trafficLights.length; i++) {
      const l = this.trafficLights[i];
      params[l.id] = l.getConfig();
    }
    this.saveSystem.saveSandboxTrial(params, {
      overallScore: result.overallScore,
      avgSpeed: result.breakdown.speed.value,
      congestion: result.breakdown.congestion.value,
      busOnTime: result.breakdown.bus.value,
      throughput: result.breakdown.throughput.value
    });

    this.audioManager.play('success');

    setTimeout(() => {
      this._cleanupScene();
      this.sceneManager.changeTo(SCENES.RESULT, {
        levelId: this.levelId,
        result,
        reason,
        levelData: this.levelData,
        isSandbox: true
      });
    }, 500);
  }

  _buildExtraButtons() {
    setTimeout(() => {
      const addBtnWrap = this._createElement('div');
      addBtnWrap.style.marginTop = '10px';
      const durBtn = this._createElement('button', 'btn btn-secondary');
      durBtn.style.width = '100%';
      durBtn.style.padding = '8px';
      durBtn.style.fontSize = '13px';
      durBtn.textContent = '⏱ 延长模拟 +60秒';
      durBtn.addEventListener('click', () => {
        this.audioManager.playClick();
        this.levelData.duration += 60;
        this._showToast('⏱ 模拟时间延长至 ' + this.levelData.duration + ' 秒', 'info');
      });
      addBtnWrap.appendChild(durBtn);
      const simCtrl = document.querySelector('.sim-controls');
      if (simCtrl) simCtrl.appendChild(addBtnWrap);
    }, 100);
  }
}
