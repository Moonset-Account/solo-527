import { uid, rand, randInt, pick, shuffle, priorityCompare, clamp } from '../core/Utils.js';
import { globalEventBus, EVENTS } from '../core/EventBus.js';
import {
  PRIORITY, TASK_TYPE, DISASTER_TYPE, BUILDING_TYPE, configManager,
} from '../config/GameConfig.js';
import { buildingSupportsTask } from './CityMap.js';

export class Task {
  constructor(type, priority, x, y, data = {}) {
    this.id = data.id || uid('task');
    this.type = type;
    this.def = configManager.getTaskDef(type);
    this.priority = priority;
    this.x = x; this.y = y;
    this.buildingId = data.buildingId || null;
    this.regionId = data.regionId || null;
    this.title = data.title || this.def.name;
    this.description = data.description || this.def.desc;
    this.workload = data.workload || this.def.baseWorkload;
    this.timeLimit = data.timeLimit || this.def.baseTimeLimit;
    this.timeElapsed = 0;
    this.timeRemaining = this.timeLimit;
    this.reward = Math.round(data.reward ?? (this.def.baseReward * configManager.getPriorityWeight(priority)));
    this.assignedResourceId = null;
    this.workProgress = 0;
    this.status = 'pending';
    this.failed = false;
    this.completed = false;
    this.satisfactionLoss = 0;
    this.score = 0;
    this.latency = 0;
    this._markerColor = configManager.getPriorityColor(priority);
    this._createdAt = 0;
    this._firstResponseAt = null;
    this._completedAt = null;
  }

  assign(resourceId) {
    this.assignedResourceId = resourceId;
    this.status = 'in_progress';
    globalEventBus.emit(EVENTS.TASK_ASSIGN, this);
  }

  progress(dt) {
    this.workProgress = clamp(this.workProgress + dt, 0, 1);
    if (this.workProgress >= 1) this._complete();
    return this.workProgress;
  }

  fail(reason = 'timeout') {
    this.failed = true;
    this.status = 'failed';
    this._completedAt = Date.now();
    globalEventBus.emit(EVENTS.TASK_FAIL, { task: this, reason });
  }

  _complete() {
    this.completed = true;
    this.status = 'completed';
    this._completedAt = Date.now();
    const timeliness = clamp(this.timeRemaining / this.timeLimit, 0, 1);
    this.score = Math.round(this.reward * (0.6 + 0.4 * timeliness) * this.def.scoreMultiplier);
    globalEventBus.emit(EVENTS.TASK_COMPLETE, this);
  }

  update(dt) {
    if (this.completed || this.failed) return;
    this.timeElapsed += dt;
    this.timeRemaining = this.timeLimit - this.timeElapsed;
    if (!this.assignedResourceId) this.latency += dt;
    const loss = (this.def.satisfactionLossPerSec || 0.05) * configManager.getPriorityWeight(this.priority) * dt;
    this.satisfactionLoss += loss;
    if (this.timeRemaining <= 0) this.fail('timeout');
  }

  getUrgency() {
    return clamp(1 - this.timeRemaining / this.timeLimit, 0, 1);
  }
}

export class DisasterEvent {
  constructor(type, x, y, data = {}) {
    this.id = uid('dis');
    this.type = type;
    this.def = configManager.getDisasterDef(type);
    this.x = x; this.y = y;
    this.radius = data.radius || rand(100, 180);
    this.intensity = data.intensity || rand(0.7, 1.2);
    this.duration = data.duration || rand(45, 90);
    this.timeElapsed = 0;
    this.timeRemaining = this.duration;
    this.active = true;
    this.relatedTaskIds = new Set();
    this.triggered = false;
    this.hazardAreaId = null;
  }

  update(dt, cityMap) {
    if (!this.active) return;
    this.timeElapsed += dt;
    this.timeRemaining = this.duration - this.timeElapsed;
    if (this.timeRemaining <= 0) this.deactivate(cityMap);
  }

  activate(cityMap) {
    if (this.triggered) return;
    this.triggered = true;
    const area = cityMap.addHazardArea(this.x, this.y, this.radius, this.type);
    this.hazardAreaId = area.id;
    this._applyBuildingEffects(cityMap);
    globalEventBus.emit(EVENTS.EVENT_TRIGGER, this);
  }

  deactivate(cityMap) {
    this.active = false;
    if (this.hazardAreaId) cityMap.removeHazardArea(this.hazardAreaId);
    this._revertBuildingEffects(cityMap);
    globalEventBus.emit(EVENTS.EVENT_RESOLVE, this);
  }

  _applyBuildingEffects(cityMap) {
    const inArea = cityMap.buildings.filter(b => {
      const dx = b.cx - this.x, dy = b.cy - this.y;
      return dx * dx + dy * dy <= this.radius * this.radius;
    });
    for (const b of inArea) {
      if (this.type === DISASTER_TYPE.RAINSTORM || this.type === DISASTER_TYPE.FLOOD) {
        b.flooded = true;
      } else if (this.type === DISASTER_TYPE.BLACKOUT) {
        b.powered = false;
      } else if (this.type === DISASTER_TYPE.TRAFFIC_JAM) {
        b.blocked = true;
      }
    }
  }

  _revertBuildingEffects(cityMap) {
    const inArea = cityMap.buildings.filter(b => {
      const dx = b.cx - this.x, dy = b.cy - this.y;
      return dx * dx + dy * dy <= this.radius * this.radius;
    });
    for (const b of inArea) {
      if (this.type === DISASTER_TYPE.RAINSTORM || this.type === DISASTER_TYPE.FLOOD) {
        b.flooded = false;
      } else if (this.type === DISASTER_TYPE.BLACKOUT) {
        b.powered = true;
      } else if (this.type === DISASTER_TYPE.TRAFFIC_JAM) {
        b.blocked = false;
      }
    }
  }
}

export class TaskManager {
  constructor() {
    this.tasks = [];
    this.disasters = [];
    this.levelCfg = null;
    this.cityMap = null;
    this._taskTimer = 0;
    this._disasterTimer = 0;
    this._usedBuildingIds = new Set();
    this.selectedTaskId = null;
  }

  init(levelCfg, cityMap) {
    this.levelCfg = levelCfg;
    this.cityMap = cityMap;
    this.tasks = [];
    this.disasters = [];
    this._taskTimer = 5;
    this._disasterTimer = levelCfg.disasterInterval * 0.6;
    this._usedBuildingIds = new Set();
    this.selectedTaskId = null;
    for (let i = 0; i < 3; i++) this._spawnInitialTask();
  }

  select(id) {
    this.selectedTaskId = id;
    const t = this.get(id);
    if (t) globalEventBus.emit(EVENTS.TASK_SELECT, t);
  }

  getSelected() { return this.selectedTaskId ? this.get(this.selectedTaskId) : null; }

  get(id) { return this.tasks.find(t => t.id === id); }

  getActive() { return this.tasks.filter(t => !t.completed && !t.failed); }

  getSortedActive() {
    return this.getActive().sort(priorityCompare);
  }

  countByStatus() {
    const s = { total: this.tasks.length, active: 0, completed: 0, failed: 0, pending: 0 };
    for (const t of this.tasks) {
      if (t.completed) s.completed++;
      else if (t.failed) s.failed++;
      else {
        s.active++;
        if (!t.assignedResourceId) s.pending++;
      }
    }
    return s;
  }

  _spawnInitialTask() {
    const types = [TASK_TYPE.TRAFFIC_CLEAR, TASK_TYPE.SUPPLY_DELIVER, TASK_TYPE.ROAD_REPAIR];
    const type = pick(types);
    this._spawnTask(type);
  }

  _spawnTask(typeOverride = null, disaster = null) {
    if (this.getActive().length >= (this.levelCfg.maxConcurrentTasks || 6)) return null;

    let type = typeOverride;
    if (!type && disaster) {
      const weights = disaster.def.taskWeights;
      const entries = Object.entries(weights);
      const total = entries.reduce((s, [, w]) => s + w, 0);
      let r = Math.random() * total;
      for (const [k, w] of entries) { if ((r -= w) <= 0) { type = k; break; } }
    }
    if (!type) type = pick(Object.values(TASK_TYPE));

    const def = configManager.getTaskDef(type);
    let building = null;
    let x, y;

    if (disaster) {
      x = disaster.x + rand(-disaster.radius * 0.5, disaster.radius * 0.5);
      y = disaster.y + rand(-disaster.radius * 0.5, disaster.radius * 0.5);
      building = this.cityMap.getNearestBuilding(x, y);
    } else {
      const maxAttempts = 30;
      for (let i = 0; i < maxAttempts; i++) {
        const b = this.cityMap.getRandomBuilding(null, this._usedBuildingIds);
        if (b && buildingSupportsTask(b, type)) { building = b; break; }
      }
      if (!building) building = this.cityMap.getRandomBuilding();
      if (building) {
        x = building.cx + rand(-20, 20);
        y = building.cy + rand(-20, 20);
      } else {
        const rp = this.cityMap.getRandomRoadPoint();
        x = rp?.x ?? this.cityMap.width / 2;
        y = rp?.y ?? this.cityMap.height / 2;
      }
    }

    if (building) this._usedBuildingIds.add(building.id);

    const r = Math.random();
    const priority = r < 0.2 ? PRIORITY.HIGH : r < 0.55 ? PRIORITY.MID : PRIORITY.LOW;
    const priorityWeight = configManager.getPriorityWeight(priority);

    const task = new Task(type, priority, x, y, {
      buildingId: building?.id,
      regionId: null,
      title: building ? `${building.name} · ${def.name}` : def.name,
      description: def.desc,
      workload: def.baseWorkload * (0.8 + Math.random() * 0.6) * priorityWeight,
      timeLimit: def.baseTimeLimit * (1.3 - (priorityWeight - 1) * 0.3),
      reward: def.baseReward * priorityWeight,
    });
    task._createdAt = performance.now();

    this.tasks.push(task);
    globalEventBus.emit(EVENTS.TASK_CREATE, task);
    if (disaster) disaster.relatedTaskIds.add(task.id);
    return task;
  }

  _spawnDisaster() {
    const types = this.levelCfg.disasters;
    if (!types || types.length === 0) return;
    const t = pick(types);
    const region = pick(this.cityMap.regions);
    const x = region.cx + rand(-region.radius * 0.5, region.radius * 0.5);
    const y = region.cy + rand(-region.radius * 0.5, region.radius * 0.5);
    const disaster = new DisasterEvent(t, x, y);
    disaster.activate(this.cityMap);
    this.disasters.push(disaster);
    const numTasks = randInt(2, 3);
    for (let i = 0; i < numTasks; i++) this._spawnTask(null, disaster);
    return disaster;
  }

  update(dt) {
    this._taskTimer -= dt;
    if (this._taskTimer <= 0) {
      this._spawnTask();
      this._taskTimer = (this.levelCfg.taskSpawnInterval || 15) * rand(0.7, 1.3);
    }

    this._disasterTimer -= dt;
    if (this._disasterTimer <= 0 && this.disasters.filter(d => d.active).length < 2) {
      this._spawnDisaster();
      this._disasterTimer = (this.levelCfg.disasterInterval || 45) * rand(0.8, 1.2);
    }

    for (const d of this.disasters) d.update(dt, this.cityMap);

    for (const t of this.tasks) {
      t.update(dt);
    }
  }

  cleanupCompleted() {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter(t => {
      if ((t.completed || t.failed) && (performance.now() - (t._completedAt || 0)) > 8000) {
        if (t.buildingId) this._usedBuildingIds.delete(t.buildingId);
        return false;
      }
      return true;
    });
  }
}
