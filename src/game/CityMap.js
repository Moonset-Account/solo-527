import { uid, rand, randInt, pick, dist } from '../core/Utils.js';
import { BUILDING_TYPE, TASK_TYPE } from '../config/GameConfig.js';

export class GraphNode {
  constructor(x, y, data = {}) {
    this.id = data.id || uid('node');
    this.x = x; this.y = y;
    this.edges = [];
    this.data = data;
    this.g = 0; this.h = 0; this.f = 0;
    this.parent = null;
    this.visited = false;
  }

  addEdge(node, cost = 1) {
    if (!this.edges.find(e => e.node === node)) {
      this.edges.push({ node, cost });
    }
    if (!node.edges.find(e => e.node === this)) {
      node.edges.push({ node: this, cost });
    }
  }

  removeEdge(node) {
    this.edges = this.edges.filter(e => e.node !== node);
    node.edges = node.edges.filter(e => e.node !== this);
  }
}

export class Graph {
  constructor() {
    this.nodes = [];
    this.nodeMap = new Map();
  }

  addNode(x, y, data = {}) {
    const node = new GraphNode(x, y, data);
    this.nodes.push(node);
    this.nodeMap.set(node.id, node);
    return node;
  }

  removeNode(node) {
    for (const e of [...node.edges]) node.removeEdge(e.node);
    const i = this.nodes.indexOf(node);
    if (i >= 0) this.nodes.splice(i, 1);
    this.nodeMap.delete(node.id);
  }

  get(id) { return this.nodeMap.get(id); }
  size() { return this.nodes.length; }

  nearestNode(x, y) {
    let best = null, bestD = Infinity;
    for (const n of this.nodes) {
      const d = dist(n.x, n.y, x, y);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  }

  nodesInRadius(x, y, r) {
    const r2 = r * r;
    return this.nodes.filter(n => (n.x - x) ** 2 + (n.y - y) ** 2 <= r2);
  }

  aStar(start, goal, heuristic = null) {
    const h = heuristic || ((a, b) => dist(a.x, a.y, b.x, b.y));
    const open = new Set([start]);
    const closed = new Set();
    const came = new Map();
    const g = new Map();
    const f = new Map();
    g.set(start, 0);
    f.set(start, h(start, goal));

    while (open.size > 0) {
      let current = null;
      let bestF = Infinity;
      for (const n of open) {
        const nv = f.get(n) ?? Infinity;
        if (nv < bestF) { bestF = nv; current = n; }
      }
      if (!current) return null;
      if (current === goal) {
        const path = [current];
        while (came.has(current)) {
          current = came.get(current);
          path.unshift(current);
        }
        return path;
      }
      open.delete(current);
      closed.add(current);
      for (const { node, cost } of current.edges) {
        if (closed.has(node)) continue;
        const tg = (g.get(current) ?? Infinity) + cost;
        if (!open.has(node)) open.add(node);
        else if (tg >= (g.get(node) ?? Infinity)) continue;
        came.set(node, current);
        g.set(node, tg);
        f.set(node, tg + h(node, goal));
      }
    }
    return null;
  }
}

export class CityMap {
  constructor(config = {}) {
    this.width = config.width ?? 1200;
    this.height = config.height ?? 800;
    this.gridSize = config.gridSize ?? 40;
    this.cols = Math.floor(this.width / this.gridSize);
    this.rows = Math.floor(this.height / this.gridSize);
    this.roadGraph = new Graph();
    this.buildings = [];
    this.intersections = [];
    this.roads = [];
    this.regions = [];
    this.hazardAreas = [];
    this.warehouse = null;
  }

  generate(levelCfg) {
    this.buildings = []; this.roads = []; this.intersections = [];
    this.regions = []; this.hazardAreas = [];
    this.roadGraph = new Graph();
    this._generateGridRoads();
    this._generateBuildings(levelCfg);
    this._generateRegions();
    this._placeWarehouse();
    return this;
  }

  _generateGridRoads() {
    const margin = this.gridSize * 2;
    const stepX = this.gridSize * randInt(3, 5);
    const stepY = this.gridSize * randInt(3, 5);
    const hNodes = []; const vNodes = [];

    for (let y = margin; y <= this.height - margin; y += stepY) {
      const row = [];
      for (let x = margin; x <= this.width - margin; x += stepX) {
        const n = this.roadGraph.addNode(x, y, { type: 'intersection' });
        row.push(n);
        this.intersections.push(n);
      }
      hNodes.push(row);
    }

    for (let i = 0; i < hNodes.length; i++) {
      for (let j = 0; j < hNodes[i].length; j++) {
        if (j < hNodes[i].length - 1) {
          hNodes[i][j].addEdge(hNodes[i][j + 1], 1);
          this.roads.push({ a: hNodes[i][j], b: hNodes[i][j + 1], horizontal: true });
        }
        if (i < hNodes.length - 1) {
          if (!vNodes[j]) vNodes[j] = [];
          const below = hNodes[i + 1]?.[j];
          if (below) {
            hNodes[i][j].addEdge(below, 1);
            this.roads.push({ a: hNodes[i][j], b: below, horizontal: false });
          }
        }
      }
    }

    if (hNodes.length >= 4 && hNodes[0].length >= 4) {
      const midRow = Math.floor(hNodes.length / 2);
      const skipCol = randInt(1, hNodes[0].length - 2);
      if (hNodes[midRow - 1]?.[skipCol] && hNodes[midRow]?.[skipCol]) {
        hNodes[midRow - 1][skipCol].removeEdge(hNodes[midRow][skipCol]);
        this.roads = this.roads.filter(r =>
          !(r.a === hNodes[midRow - 1][skipCol] && r.b === hNodes[midRow][skipCol]) &&
          !(r.b === hNodes[midRow - 1][skipCol] && r.a === hNodes[midRow][skipCol])
        );
      }
    }
  }

  _generateBuildings(levelCfg) {
    const buildingTypes = [
      { type: BUILDING_TYPE.RESIDENTIAL, w: [30, 50], h: [30, 50], color: '#64748b', weight: 50 },
      { type: BUILDING_TYPE.COMMERCIAL, w: [40, 65], h: [40, 65], color: '#475569', weight: 25 },
      { type: BUILDING_TYPE.HOSPITAL, w: [55, 75], h: [55, 75], color: '#dc2626', weight: 4 },
      { type: BUILDING_TYPE.SCHOOL, w: [60, 80], h: [50, 70], color: '#2563eb', weight: 4 },
      { type: BUILDING_TYPE.SUBSTATION, w: [40, 60], h: [40, 60], color: '#ca8a04', weight: 6 },
      { type: BUILDING_TYPE.WATER_TOWER, w: [35, 45], h: [35, 45], color: '#0891b2', weight: 4 },
      { type: BUILDING_TYPE.POWER_PLANT, w: [70, 90], h: [60, 80], color: '#7c3aed', weight: 2 },
    ];

    const totalWeight = buildingTypes.reduce((s, t) => s + t.weight, 0);
    const pickType = () => {
      let r = Math.random() * totalWeight;
      for (const t of buildingTypes) { if ((r -= t.weight) <= 0) return t; }
      return buildingTypes[0];
    };

    const targetCount = levelCfg?.citySize?.buildings || 15;
    let attempts = 0;
    while (this.buildings.length < targetCount && attempts < targetCount * 20) {
      attempts++;
      const tDef = pickType();
      const w = rand(tDef.w[0], tDef.w[1]);
      const h = rand(tDef.h[0], tDef.h[1]);
      const x = rand(this.gridSize * 1.5, this.width - w - this.gridSize * 1.5);
      const y = rand(this.gridSize * 1.5, this.height - h - this.gridSize * 1.5);
      const nearRoad = this._isNearRoad(x + w / 2, y + h / 2, this.gridSize * 2);
      if (!nearRoad) continue;
      const overlap = this.buildings.some(b => (
        x < b.x + b.w + 15 && x + w + 15 > b.x &&
        y < b.y + b.h + 15 && y + h + 15 > b.y
      ));
      if (overlap) continue;
      this.buildings.push({
        id: uid('bld'),
        type: tDef.type,
        x, y, w, h,
        cx: x + w / 2, cy: y + h / 2,
        color: tDef.color,
        hp: 100,
        powered: true,
        flooded: false,
        blocked: false,
        name: this._nameBuilding(tDef.type),
      });
    }
  }

  _nameBuilding(type) {
    const names = {
      [BUILDING_TYPE.RESIDENTIAL]: ['嘉和园', '幸福里', '温馨公寓', '锦绣家园', '安居楼'],
      [BUILDING_TYPE.COMMERCIAL]: ['国贸中心', '万达广场', '银座商城', '恒隆广场', '万象城'],
      [BUILDING_TYPE.HOSPITAL]: ['市立医院', '中心医院', '仁济医院', '协和诊所'],
      [BUILDING_TYPE.SCHOOL]: ['实验中学', '第一小学', '育才中学', '阳光小学'],
      [BUILDING_TYPE.SUBSTATION]: ['城东变电站', '南区供电站', '枢纽变电站'],
      [BUILDING_TYPE.WATER_TOWER]: ['市北水塔', '中心供水站', '水库泵站'],
      [BUILDING_TYPE.POWER_PLANT]: ['主力发电厂', '热电厂'],
    };
    return pick(names[type] || ['未知建筑']);
  }

  _isNearRoad(x, y, dist) {
    return this.roadGraph.nearestNode(x, y) &&
      dist(this.roadGraph.nearestNode(x, y).x, this.roadGraph.nearestNode(x, y).y, x, y) < dist;
  }

  _generateRegions() {
    const regionNames = ['东城区', '西城区', '南区', '北区', '市中心'];
    const cx = this.width / 2, cy = this.height / 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      this.regions.push({
        id: `region_${i}`,
        name: regionNames[i],
        cx: cx + Math.cos(angle) * this.width * 0.22,
        cy: cy + Math.sin(angle) * this.height * 0.22,
        radius: 180,
        satisfactionMod: 1.0,
        disaster: null,
      });
    }
    this.regions.push({
      id: 'region_center', name: '市中心',
      cx, cy, radius: 150, satisfactionMod: 1.2, disaster: null,
    });
  }

  _placeWarehouse() {
    const cornerNode = this.roadGraph.nodes
      .filter(n => n.x < this.width * 0.3 && n.y < this.height * 0.3)
      .sort((a, b) => a.x + a.y - b.x - b.y)[0];
    if (cornerNode) {
      this.warehouse = {
        id: 'warehouse',
        name: '应急指挥中心',
        node: cornerNode,
        x: cornerNode.x - 30, y: cornerNode.y - 30,
        w: 60, h: 60,
        cx: cornerNode.x, cy: cornerNode.y,
      };
    }
  }

  getBuilding(id) { return this.buildings.find(b => b.id === id); }

  getNearestBuilding(x, y) {
    let best = null, bestD = Infinity;
    for (const b of this.buildings) {
      const d = dist(b.cx, b.cy, x, y);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  findBuildingsByRegion(regionId) {
    const r = this.regions.find(r => r.id === regionId);
    if (!r) return [];
    return this.buildings.filter(b => dist(b.cx, b.cy, r.cx, r.cy) < r.radius);
  }

  addHazardArea(centerX, centerY, radius, type) {
    const area = {
      id: uid('hz'),
      x: centerX, y: centerY, r: radius,
      type, intensity: 1.0, timeRemaining: 60,
    };
    this.hazardAreas.push(area);
    return area;
  }

  removeHazardArea(id) {
    const i = this.hazardAreas.findIndex(h => h.id === id);
    if (i >= 0) this.hazardAreas.splice(i, 1);
  }

  isPointInHazard(x, y) {
    for (const h of this.hazardAreas) {
      if (dist(x, y, h.x, h.y) <= h.r) return h;
    }
    return null;
  }

  getRoadSpeedModifier(x, y) {
    let mod = 1.0;
    const hz = this.isPointInHazard(x, y);
    if (hz) {
      if (hz.type === 'flood' || hz.type === 'rainstorm') mod *= 0.55;
      else if (hz.type === 'traffic_jam') mod *= 0.4;
      else if (hz.type === 'fire') mod *= 0.7;
    }
    return mod;
  }

  getRandomBuilding(types = null, excludeIds = null) {
    let pool = this.buildings;
    if (types) pool = pool.filter(b => types.includes(b.type));
    if (excludeIds) pool = pool.filter(b => !excludeIds.includes(b.id));
    return pool.length ? pick(pool) : null;
  }

  getRandomRoadPoint() {
    const road = pick(this.roads);
    if (!road) return null;
    const t = Math.random();
    return {
      x: road.a.x + (road.b.x - road.a.x) * t,
      y: road.a.y + (road.b.y - road.a.y) * t,
      nodeA: road.a, nodeB: road.b,
    };
  }

  findPathOnRoad(fromX, fromY, toX, toY) {
    const start = this.roadGraph.nearestNode(fromX, fromY);
    const end = this.roadGraph.nearestNode(toX, toY);
    if (!start || !end || start === end) return null;
    return this.roadGraph.aStar(start, end);
  }
}

export function buildingSupportsTask(building, taskType) {
  const map = {
    [TASK_TYPE.POWER_RESTORE]: [BUILDING_TYPE.SUBSTATION, BUILDING_TYPE.POWER_PLANT, BUILDING_TYPE.HOSPITAL],
    [TASK_TYPE.ROAD_REPAIR]: [BUILDING_TYPE.COMMERCIAL, BUILDING_TYPE.RESIDENTIAL],
    [TASK_TYPE.FLOOD_CLEAR]: Object.values(BUILDING_TYPE),
    [TASK_TYPE.FIRE_SUPPRESS]: Object.values(BUILDING_TYPE),
    [TASK_TYPE.SUPPLY_DELIVER]: [BUILDING_TYPE.HOSPITAL, BUILDING_TYPE.SCHOOL, BUILDING_TYPE.RESIDENTIAL],
    [TASK_TYPE.TRAFFIC_CLEAR]: [BUILDING_TYPE.COMMERCIAL, BUILDING_TYPE.RESIDENTIAL],
  };
  const list = map[taskType];
  return list ? list.includes(building.type) : true;
}
