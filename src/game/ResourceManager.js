import { uid, dist, lerp, clamp, rand } from '../core/Utils.js';
import { globalEventBus, EVENTS } from '../core/EventBus.js';
import { RESOURCE_TYPE, configManager } from '../config/GameConfig.js';

export class Resource {
  constructor(type, startX, startY, data = {}) {
    this.id = data.id || uid('res');
    this.type = type;
    this.config = configManager.getResourceDef(type);
    this.x = startX; this.y = startY;
    this.targetX = startX; this.targetY = startY;
    this.status = 'idle';
    this.path = [];
    this.pathIndex = 0;
    this.speed = this.config.baseSpeed;
    this.currentTaskId = null;
    this.workProgress = 0;
    this.heading = 0;
    this.selected = false;
    this.capacityUsed = 0;
    this.homeX = startX; this.homeY = startY;
    this.dispatchCount = 0;
    this.totalWorkTime = 0;
    this._markerColor = this.config.color;
  }

  assignPath(path) {
    if (!path || path.length === 0) return false;
    this.path = path.slice();
    this.pathIndex = 0;
    this.status = 'moving';
    return true;
  }

  goHome() {
    this.currentTaskId = null;
    this.status = 'returning';
    this.workProgress = 0;
    this._targetX = this.homeX;
    this._targetY = this.homeY;
  }

  update(dt, cityMap) {
    this._config = this.config;
    if (this.status === 'moving' || this.status === 'returning') {
      if (this.path.length > 0 && this.pathIndex < this.path.length) {
        const target = this.path[this.pathIndex];
        let spd = this.speed;
        const hzMod = cityMap?.getRoadSpeedModifier?.(this.x, this.y) ?? 1.0;
        spd *= hzMod;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const d = Math.hypot(dx, dy);
        const step = spd * dt;
        if (d <= step) {
          this.x = target.x; this.y = target.y;
          this.pathIndex++;
          if (this.pathIndex >= this.path.length) {
            if (this.status === 'returning') {
              this.status = 'idle';
              this.path = [];
              globalEventBus.emit(EVENTS.RESOURCE_RETURN, this);
            } else {
              this.status = 'arrived';
              this.path = [];
              globalEventBus.emit(EVENTS.RESOURCE_ARRIVE, this);
            }
          }
        } else {
          this.x += (dx / d) * step;
          this.y += (dy / d) * step;
          this.heading = Math.atan2(dy, dx);
        }
      } else {
        const tx = this._targetX ?? this.homeX;
        const ty = this._targetY ?? this.homeY;
        const dx = tx - this.x; const dy = ty - this.y;
        const d = Math.hypot(dx, dy);
        const step = this.speed * dt;
        if (d <= step) {
          this.x = tx; this.y = ty;
          if (this.status === 'returning') {
            this.status = 'idle';
            globalEventBus.emit(EVENTS.RESOURCE_RETURN, this);
          }
        } else {
          this.x += (dx / d) * step;
          this.y += (dy / d) * step;
          this.heading = Math.atan2(dy, dx);
        }
      }
    } else if (this.status === 'working') {
      this.totalWorkTime += dt;
    }
  }

  startWorking() {
    this.status = 'working';
    this.workProgress = 0;
  }

  work(dt, taskDef) {
    let mult = 1.0;
    if (taskDef && this.config.skills) {
      mult = this.config.skills[taskTypeForSkill(taskDef)] ?? 1.0;
    }
    this.workProgress += (dt * (this.config.workSpeed * mult));
    this.totalWorkTime += dt;
    return this.workProgress;
  }

  finishWork() {
    this.status = 'idle';
    this.workProgress = 0;
    this.currentTaskId = null;
    this.dispatchCount++;
  }

  isAvailable() {
    return this.status === 'idle';
  }

  toDebug() {
    return {
      id: this.id.slice(-6),
      type: this.type,
      status: this.status,
      task: this.currentTaskId?.slice(-6) || 'none',
      progress: Math.round(this.workProgress * 100) + '%',
    };
  }
}

function taskTypeForSkill(taskDef) {
  const keys = ['power_restore', 'flood_clear', 'traffic_clear', 'supply_deliver', 'road_repair', 'fire_suppress'];
  return keys.find(k => taskDef.name?.includes(
    { power_restore: '供电', flood_clear: '排涝', traffic_clear: '疏导', supply_deliver: '物资', road_repair: '维修', fire_suppress: '灭火' }[k] ?? ''
  )) || '';
}

export class ResourceManager {
  constructor() {
    this.resources = [];
    this.selectedId = null;
    this.map = null;
  }

  initFromLevel(levelCfg, cityMap) {
    this.resources = [];
    this.map = cityMap;
    const wh = cityMap.warehouse;
    const baseX = wh ? wh.cx : 100;
    const baseY = wh ? wh.cy : 100;
    let idx = 0;
    for (const group of levelCfg.resources) {
      for (let i = 0; i < group.count; i++) {
        const ox = Math.cos((idx / 8) * Math.PI * 2) * 40;
        const oy = Math.sin((idx / 8) * Math.PI * 2) * 40;
        idx++;
        const r = new Resource(group.type, baseX + ox, baseY + oy);
        r.homeX = r.x; r.homeY = r.y;
        this.resources.push(r);
      }
    }
    return this;
  }

  get(id) { return this.resources.find(r => r.id === id); }

  getAvailable(type = null) {
    return this.resources.filter(r => r.isAvailable() && (!type || r.type === type));
  }

  getByType(type) { return this.resources.filter(r => r.type === type); }

  select(id) {
    this.selectedId = id;
    for (const r of this.resources) r.selected = r.id === id;
    const sel = this.get(id);
    if (sel) globalEventBus.emit(EVENTS.RESOURCE_SELECT, sel);
  }

  deselect() {
    this.selectedId = null;
    for (const r of this.resources) r.selected = false;
  }

  getSelected() { return this.selectedId ? this.get(this.selectedId) : null; }

  dispatch(resource, task, cityMap) {
    if (!resource.isAvailable()) return false;
    const path = cityMap.findPathOnRoad(resource.x, resource.y, task.x, task.y);
    if (!path) {
      resource._targetX = task.x;
      resource._targetY = task.y;
      resource.status = 'moving';
    } else {
      resource.assignPath(path);
    }
    resource.currentTaskId = task.id;
    globalEventBus.emit(EVENTS.RESOURCE_DISPATCH, { resource, task });
    return true;
  }

  assignBestForTask(task, cityMap) {
    const def = configManager.getTaskDef(task.type);
    let candidates = this.getAvailable(def.requiredResource);
    if (candidates.length === 0 && def.altResource) {
      candidates = this.getAvailable(def.altResource);
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) =>
      dist(a.x, a.y, task.x, task.y) - dist(b.x, b.y, task.x, task.y)
    );
    const best = candidates[0];
    this.dispatch(best, task, cityMap);
    this.select(best.id);
    return best;
  }

  recallAll() {
    for (const r of this.resources) {
      if (r.status === 'working' || r.status === 'moving' || r.status === 'arrived') {
        r.goHome();
      }
    }
  }

  update(dt, cityMap) {
    for (const r of this.resources) r.update(dt, cityMap);
  }

  getCounts() {
    const counts = {};
    const totalByType = {};
    for (const r of this.resources) {
      totalByType[r.type] = (totalByType[r.type] || 0) + 1;
      const key = `${r.type}_${r.status}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return { byStatus: counts, totalByType };
  }

  toArray() {
    return this.resources.map(r => ({
      id: r.id, type: r.type, x: r.x, y: r.y,
      status: r.status, path: r.path, workProgress: r.workProgress,
      selected: r.selected, _config: r.config, heading: r.heading,
    }));
  }
}
