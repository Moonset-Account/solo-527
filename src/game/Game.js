import { globalEventBus, EVENTS } from '../core/EventBus.js';
import { clamp, formatTime, priorityCompare } from '../core/Utils.js';
import { CityMap, buildingSupportsTask } from './CityMap.js';
import { ResourceManager } from './ResourceManager.js';
import { TaskManager } from './TaskManager.js';
import { configManager, GAME_STATES } from '../config/GameConfig.js';

export class Game {
  constructor() {
    this.map = null;
    this.resources = new ResourceManager();
    this.tasks = new TaskManager();
    this.levelCfg = null;
    this.levelId = null;
    this.state = null;

    this.timeRemaining = 0;
    this.duration = 0;
    this.elapsed = 0;

    this.satisfaction = 80;
    this.score = 0;
    this.budget = 0;
    this.cost = 0;
    this.mistakes = 0;

    this.completedCount = 0;
    this.failedCount = 0;
    this.totalLatency = 0;

    this.report = null;
    this._bindEvents();
  }

  _bindEvents() {
    this._listeners = [
      globalEventBus.on(EVENTS.TASK_COMPLETE, (t) => this._onTaskComplete(t)),
      globalEventBus.on(EVENTS.TASK_FAIL, ({ task }) => this._onTaskFail(task)),
      globalEventBus.on(EVENTS.TASK_ASSIGN, (t) => this._onTaskAssign(t)),
      globalEventBus.on(EVENTS.RESOURCE_DISPATCH, ({ resource, task }) => this._onDispatch(resource, task)),
      globalEventBus.on(EVENTS.RESOURCE_ARRIVE, (r) => this._onResourceArrive(r)),
      globalEventBus.on(EVENTS.EVENT_TRIGGER, (d) => this._onDisaster(d)),
      globalEventBus.on(EVENTS.EVENT_RESOLVE, (d) => this._onDisasterResolve(d)),
    ];
  }

  startLevel(levelId) {
    this.levelId = levelId;
    this.levelCfg = configManager.getLevel(levelId);
    this.duration = this.levelCfg.duration;
    this.timeRemaining = this.duration;
    this.elapsed = 0;

    this.satisfaction = configManager.get('game.startSatisfaction');
    this.score = 0;
    this.budget = configManager.get('economy.startBudget');
    this.cost = 0;
    this.mistakes = 0;
    this.completedCount = 0;
    this.failedCount = 0;
    this.totalLatency = 0;
    this.report = null;

    this.map = new CityMap({ width: 1400, height: 900, gridSize: 40 });
    this.map.generate(this.levelCfg);
    this.resources.initFromLevel(this.levelCfg, this.map);
    this.tasks.init(this.levelCfg, this.map);

    globalEventBus.emit(EVENTS.LEVEL_LOAD, { levelId, cfg: this.levelCfg });
    this.state = GAME_STATES.PLAYING;
  }

  _onTaskAssign(task) {
    if (task._firstResponseAt === null) {
      task._firstResponseAt = performance.now();
    }
  }

  _onDispatch(resource, task) {
    const def = resource.config;
    const dispatchCost = Math.round(def.baseCost * configManager.get('economy.dispatchCostMultiplier'));
    this.cost += dispatchCost;
    this.budget -= dispatchCost;
    globalEventBus.emit(EVENTS.COST_CHANGE, this.cost);
  }

  _onResourceArrive(resource) {
    const task = this.tasks.get(resource.currentTaskId);
    if (!task || task.completed || task.failed) {
      resource.goHome();
      return;
    }
    resource.startWorking();
  }

  _onTaskComplete(task) {
    this.completedCount++;
    this.score += task.score;
    this.budget += task.reward;
    const satisfactionGain = 2 + (task.priority === 'high' ? 3 : task.priority === 'mid' ? 2 : 1);
    this.changeSatisfaction(satisfactionGain);
    if (task._firstResponseAt) {
      this.totalLatency += (task._firstResponseAt - task._createdAt) / 1000;
    }
    this.tasks._usedBuildingIds.delete(task.buildingId);

    const resource = this.resources.resources.find(r => r.id === task.assignedResourceId);
    if (resource) {
      resource.finishWork();
      resource.goHome();
    }
    globalEventBus.emit(EVENTS.SCORE_CHANGE, this.score);
  }

  _onTaskFail(task) {
    this.failedCount++;
    this.mistakes++;
    const loss = Math.round(task.reward * configManager.get('economy.failPenaltyRate'));
    this.cost += loss;
    this.budget -= loss;
    const penalty = (task.priority === 'high' ? 10 : task.priority === 'mid' ? 6 : 3);
    this.changeSatisfaction(-penalty);
    this.tasks._usedBuildingIds.delete(task.buildingId);

    const resource = this.resources.resources.find(r => r.id === task.assignedResourceId);
    if (resource) {
      resource.status = 'idle';
      resource.workProgress = 0;
      resource.currentTaskId = null;
      resource.goHome();
    }
    globalEventBus.emit(EVENTS.SCORE_CHANGE, this.score);
  }

  _onDisaster(disaster) {
    this.changeSatisfaction(-5);
    this.mistakes++;
  }

  _onDisasterResolve(disaster) {
    this.changeSatisfaction(2);
  }

  changeSatisfaction(delta) {
    this.satisfaction = clamp(this.satisfaction + delta,
      configManager.get('game.minSatisfaction'),
      configManager.get('game.maxSatisfaction'));
    globalEventBus.emit(EVENTS.SATISFACTION_CHANGE, this.satisfaction);
  }

  assignResourceToTask(resource, task) {
    if (!resource || !task) return false;
    if (!resource.isAvailable()) return false;
    if (task.assignedResourceId) return false;
    task.assign(resource.id);
    return this.resources.dispatch(resource, task, this.map);
  }

  autoDispatch(task) {
    const r = this.resources.assignBestForTask(task, this.map);
    if (r) {
      task.assign(r.id);
      return r;
    }
    globalEventBus.emit(EVENTS.UI_TOAST, {
      message: '没有可用资源，请等待或优先处理',
      type: 'warning',
    });
    return null;
  }

  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.completed || task.failed) return;
    const resource = this.resources.resources.find(r => r.id === task.assignedResourceId);
    if (resource) {
      resource.status = 'idle';
      resource.workProgress = 0;
      resource.currentTaskId = null;
      resource.goHome();
    }
    task.assignedResourceId = null;
    task.status = 'pending';
    this.mistakes++;
    globalEventBus.emit(EVENTS.TASK_CANCEL, task);
  }

  retryLevel() { this.startLevel(this.levelId); }

  endLevel(victory) {
    const finalScore = this._calcFinalScore(victory);
    const stars = victory ? configManager.getStarsFromScore(finalScore, this.levelId) : 0;
    this.report = {
      victory,
      levelId: this.levelId,
      levelName: this.levelCfg.name,
      score: finalScore,
      stars,
      stats: {
        duration: this.elapsed,
        completed: this.completedCount,
        failed: this.failedCount,
        mistakes: this.mistakes,
        cost: this.cost,
        budget: this.budget,
        satisfaction: this.satisfaction,
        avgLatency: this.completedCount > 0
          ? (this.totalLatency / this.completedCount).toFixed(1) : 0,
        targetCompleted: this.levelCfg.targetCompletedTasks,
        targetSatisfaction: this.levelCfg.targetSatisfaction,
      },
      scoreBreakdown: this._scoreBreakdown(victory, finalScore),
    };
    this.state = victory ? GAME_STATES.REPORT : GAME_STATES.FAILURE;
    globalEventBus.emit(victory ? EVENTS.LEVEL_COMPLETE : EVENTS.LEVEL_FAIL, this.report);
    return this.report;
  }

  _calcFinalScore(victory) {
    let s = this.score;
    s += Math.round(this.satisfaction * 10);
    s += victory ? Math.round(this.timeRemaining * 5) : 0;
    s -= this.failedCount * 150;
    s -= this.mistakes * 50;
    s += this.completedCount * 80;
    s += this.budget > 0 ? Math.round(this.budget * 0.1) : 0;
    return Math.max(0, s);
  }

  _scoreBreakdown(victory, final) {
    const items = [
      { label: '任务完成奖励', value: this.score, good: true },
      { label: `满意度 ${this.satisfaction.toFixed(0)}`, value: Math.round(this.satisfaction * 10), good: this.satisfaction > 50 },
    ];
    if (victory) items.push({ label: '时间奖励', value: Math.round(this.timeRemaining * 5), good: true });
    items.push({ label: `完成 ${this.completedCount} 个任务`, value: this.completedCount * 80, good: true });
    if (this.failedCount > 0) items.push({ label: `失败 ${this.failedCount} 个任务`, value: -this.failedCount * 150, good: false });
    if (this.mistakes > 0) items.push({ label: `失误 ${this.mistakes} 次`, value: -this.mistakes * 50, good: false });
    if (this.budget > 0) items.push({ label: `预算结余`, value: Math.round(this.budget * 0.1), good: true });
    items.push({ label: '总计', value: final, good: final > 0, final: true });
    return items;
  }

  _checkVictoryConditions() {
    if (this.timeRemaining <= 0) {
      if (this.completedCount >= this.levelCfg.targetCompletedTasks &&
          this.satisfaction >= this.levelCfg.targetSatisfaction) {
        return this.endLevel(true);
      } else {
        return this.endLevel(false);
      }
    }
    if (this.satisfaction <= configManager.get('game.failSatisfaction')) {
      return this.endLevel(false);
    }
  }

  update(dt) {
    if (this.state !== GAME_STATES.PLAYING) return;

    this.elapsed += dt;
    this.timeRemaining = Math.max(0, this.duration - this.elapsed);

    this.tasks.update(dt);
    this.resources.update(dt, this.map);

    for (const r of this.resources.resources) {
      if (r.status === 'working' && r.currentTaskId) {
        const t = this.tasks.get(r.currentTaskId);
        if (t && !t.completed && !t.failed) {
          const progDone = r.work(dt, t.def);
          t.workProgress = progDone;
          if (progDone >= 1) {
            t.workProgress = 1;
            t.progress(0);
            t._complete();
          }
        }
      }
    }

    for (const t of this.tasks.getActive()) {
      if (!t.assignedResourceId) {
        this.changeSatisfaction(-0.05 * dt * configManager.getPriorityWeight(t.priority));
      }
    }

    this.tasks.cleanupCompleted();
    this._checkVictoryConditions();
  }

  forRenderer() {
    return {
      tasks: this.tasks.getActive().map(t => ({
        id: t.id, type: t.type, priority: t.priority,
        x: t.x, y: t.y, timeRemaining: t.timeRemaining,
        timeLimit: t.timeLimit, workProgress: t.workProgress,
        _markerColor: t._markerColor,
      })),
      resources: this.resources.toArray(),
    };
  }

  getDebugInfo() {
    return {
      state: this.state,
      time: formatTime(this.timeRemaining),
      score: this.score,
      satisfaction: `${this.satisfaction.toFixed(1)}%`,
      budget: this.budget,
      cost: this.cost,
      mistakes: this.mistakes,
      activeTasks: this.tasks.getActive().length,
      completedTasks: this.completedCount,
      failedTasks: this.failedCount,
      disasters: this.tasks.disasters.filter(d => d.active).length,
      idleResources: this.resources.getAvailable().length,
      totalResources: this.resources.resources.length,
    };
  }
}
