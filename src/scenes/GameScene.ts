import { BaseScene } from './BaseScene';
import { EventBus } from '../core/EventBus';
import { SceneManager } from '../core/SceneManager';
import { SaveSystem } from '../core/SaveSystem';
import { Telemetry } from '../core/Telemetry';
import { InputManager, PointerEvent, KeyInputEvent } from '../core/InputManager';
import { CircuitSimulator } from '../simulation/CircuitSimulator';
import {
  CircuitGraph,
  BaseComponent,
  ComponentType,
  ComponentId,
  Wire,
  WireId,
  NodeId,
  Pin,
  SimState,
} from '../simulation/types';
import { uuid, roundToGrid, clamp, dist, lerp } from '../utils/math';
import { pointInRect, pointInCircle, rotatePoint, snapToGrid } from '../utils/geometry';

const GRID_SIZE = 40;
const COMPONENT_WIDTH = 80;
const COMPONENT_HEIGHT = 60;
const PIN_RADIUS = 10;
const MAX_UNDO = 100;
const SIM_STEP_MS = 16;

type GameMode = 'level' | 'sandbox' | 'daily';

interface GameScenePayload {
  mode: GameMode;
  levelId?: string;
  date?: string;
}

interface Goal {
  id: string;
  description: string;
  type: 'bulb_brightness' | 'component_count' | 'wire_count' | 'no_short_circuit' | 'custom';
  target: number;
  targetComponentId?: string;
  params?: Record<string, unknown>;
  completed: boolean;
}

interface QuestLevel {
  id: string;
  name: string;
  description: string;
  components: string[];
  goals: Omit<Goal, 'completed'>[];
  maxStars: number;
  timeLimit?: number;
  initialComponents?: Partial<BaseComponent>[];
}

const QUEST_LEVELS: Record<string, QuestLevel> = {
  'l1-1': {
    id: 'l1-1', name: '点亮第一颗灯',
    description: '搭建最简单的电路，让灯泡亮起',
    components: ['battery', 'bulb', 'wire_joint'],
    goals: [
      { id: 'g1', description: '灯泡亮度达到 80% 以上', type: 'bulb_brightness', target: 0.8, params: { minCount: 1 } },
      { id: 'g2', description: '至少使用 1 根导线连接', type: 'wire_count', target: 1 },
      { id: 'g3', description: '电路无短路', type: 'no_short_circuit', target: 1 },
    ],
    maxStars: 3,
  },
  'l1-2': {
    id: 'l1-2', name: '开关控制',
    description: '添加开关，控制灯泡的亮灭',
    components: ['battery', 'bulb', 'switch', 'wire_joint'],
    goals: [
      { id: 'g1', description: '灯泡亮度达到 60% 以上', type: 'bulb_brightness', target: 0.6 },
      { id: 'g2', description: '使用至少 1 个开关', type: 'component_count', target: 1, params: { type: 'switch' } },
      { id: 'g3', description: '电路无短路', type: 'no_short_circuit', target: 1 },
    ],
    maxStars: 3,
  },
};

export const DEFAULT_AVAILABLE_COMPONENTS: ComponentType[] = [
  'battery', 'resistor', 'capacitor', 'switch', 'bulb', 'wire_joint',
];

const COMPONENT_PARAMS: Record<ComponentType, Record<string, number | boolean>> = {
  battery: { voltage: 3.0 },
  resistor: { resistance: 10 },
  capacitor: { capacitance: 0.001, capacity: 100, chargeResistance: 100, maxVoltage: 5 },
  switch: { closed: false },
  bulb: { resistance: 10, maxPower: 10 },
  wire_joint: {},
};

const COMPONENT_NAMES: Record<ComponentType, string> = {
  battery: '电池',
  resistor: '电阻',
  capacitor: '电容',
  switch: '开关',
  bulb: '灯泡',
  wire_joint: '接线点',
};

const COMPONENT_ICONS: Record<ComponentType, string> = {
  battery: '🔋',
  resistor: '📏',
  capacitor: '⚡',
  switch: '🔘',
  bulb: '💡',
  wire_joint: '🔵',
};

const COMPONENT_SHORTCUTS: Record<string, ComponentType> = {
  '1': 'battery',
  '2': 'resistor',
  '3': 'capacitor',
  '4': 'switch',
  '5': 'bulb',
  '6': 'wire_joint',
};

type UndoAction =
  | { kind: 'add_component'; component: BaseComponent }
  | { kind: 'remove_component'; component: BaseComponent; wires: Wire[] }
  | { kind: 'move_component'; componentId: ComponentId; fromX: number; fromY: number; toX: number; toY: number }
  | { kind: 'toggle_switch'; componentId: ComponentId; from: boolean; to: boolean }
  | { kind: 'add_wire'; wire: Wire }
  | { kind: 'remove_wire'; wire: Wire };

class WireManager {
  createWire(fromNode: NodeId, toNode: NodeId, path?: { x: number; y: number }[]): Wire {
    return { id: `w_${uuid()}`, fromNode, toNode, pathPoints: path ?? [] };
  }
}

class ComponentFactory {
  createComponent(type: ComponentType, x: number, y: number, rotation = 0): BaseComponent {
    const id = `c_${uuid()}`;
    const params = { ...COMPONENT_PARAMS[type] };
    const pins = this.getPinsForType(type, id, rotation);
    return {
      id, type, x, y, rotation, pins, params,
      state: this.getInitialState(type),
    };
  }
  private getPinsForType(type: ComponentType, compId: string, rotation: number): Pin[] {
    const pinConfigs: Record<ComponentType, { dx: number; dy: number }[]> = {
      battery: [{ dx: -COMPONENT_WIDTH / 2, dy: 0 }, { dx: COMPONENT_WIDTH / 2, dy: 0 }],
      resistor: [{ dx: -COMPONENT_WIDTH / 2, dy: 0 }, { dx: COMPONENT_WIDTH / 2, dy: 0 }],
      capacitor: [{ dx: -COMPONENT_WIDTH / 2, dy: 0 }, { dx: COMPONENT_WIDTH / 2, dy: 0 }],
      switch: [{ dx: -COMPONENT_WIDTH / 2, dy: 0 }, { dx: COMPONENT_WIDTH / 2, dy: 0 }],
      bulb: [{ dx: -COMPONENT_WIDTH / 2 + 10, dy: COMPONENT_HEIGHT / 2 }, { dx: COMPONENT_WIDTH / 2 - 10, dy: COMPONENT_HEIGHT / 2 }],
      wire_joint: [{ dx: 0, dy: 0 }],
    };
    const configs = pinConfigs[type] || [];
    return configs.map((p, i) => {
      let rx: number, ry: number;
      if (rotation === 0) {
        rx = p.dx; ry = p.dy;
      } else {
        const r = rotatePoint(p.dx, p.dy, 0, 0, rotation);
        rx = r.x; ry = r.y;
      }
      return { nodeId: `n_${compId}_${i}`, localX: rx, localY: ry };
    });
  }
  private getInitialState(type: ComponentType): Record<string, number | boolean> {
    switch (type) {
      case 'battery': return { voltage: COMPONENT_PARAMS.battery.voltage as number, current: 0 };
      case 'resistor': return { voltage: 0, current: 0, power: 0 };
      case 'capacitor': return { charge: 0, voltage: 0, current: 0 };
      case 'switch': return { closed: false, current: 0 };
      case 'bulb': return { brightness: 0, current: 0, power: 0 };
      case 'wire_joint': return { current: 0 };
      default: return {};
    }
  }
}

class QuestSystem {
  goals: Goal[] = [];
  private levelData: QuestLevel | null = null;
  loadLevel(levelId: string): QuestLevel | null {
    const data = QUEST_LEVELS[levelId];
    if (data) {
      this.levelData = data;
      this.goals = data.goals.map(g => ({ ...g, completed: false }));
    }
    return data;
  }
  getAvailableComponents(): ComponentType[] {
    return this.levelData ? (this.levelData.components as ComponentType[]) : DEFAULT_AVAILABLE_COMPONENTS;
  }
  update(graph: CircuitGraph, simState: SimState): { changed: boolean; allCompleted: boolean } {
    if (this.goals.length === 0) return { changed: false, allCompleted: true };
    let changed = false;
    for (const goal of this.goals) {
      const before = goal.completed;
      goal.completed = this.checkGoal(goal, graph, simState);
      if (goal.completed !== before) changed = true;
    }
    return { changed, allCompleted: this.goals.every(g => g.completed) };
  }
  private checkGoal(goal: Goal, graph: CircuitGraph, simState: SimState): boolean {
    switch (goal.type) {
      case 'bulb_brightness': {
        const minCount = (goal.params?.minCount as number) || 1;
        let count = 0;
        for (const comp of graph.components.values()) {
          if (comp.type === 'bulb') {
            const state = simState.componentStates.get(comp.id);
            if (((state?.brightness as number) || 0) >= goal.target) count++;
          }
        }
        return count >= minCount;
      }
      case 'component_count': {
        const t = goal.params?.type as ComponentType;
        let count = 0;
        for (const comp of graph.components.values()) {
          if (!t || comp.type === t) count++;
        }
        return count >= goal.target;
      }
      case 'wire_count': return graph.wires.size >= goal.target;
      case 'no_short_circuit': return !simState.errors.some(e => e.type === 'short_circuit');
      default: return false;
    }
  }
  calculateStars(timeMs: number, simState: SimState, _graph: CircuitGraph): number {
    if (!this.levelData) return 0;
    const max = this.levelData.maxStars;
    const ratio = this.goals.filter(g => g.completed).length / this.goals.length;
    let stars = Math.round(ratio * max);
    if (simState.errors.some(e => e.severity === 'error')) stars = Math.max(0, stars - 1);
    if (this.levelData.timeLimit && timeMs > this.levelData.timeLimit) stars = Math.max(0, stars - 1);
    return clamp(stars, 0, max);
  }
}

interface Viewport { offsetX: number; offsetY: number; scale: number; }

export class GameScene extends BaseScene {
  private sceneManager: SceneManager;
  private saveSystem: SaveSystem;
  private telemetry: Telemetry;
  private uiRoot: HTMLElement | null = null;
  private uiContainer: HTMLDivElement | null = null;
  private inputUnsubscribe: (() => void)[] = [];
  private _inputManager: InputManager | null = null;

  private payload: GameScenePayload = { mode: 'sandbox' };
  private questLevel: QuestLevel | null = null;

  private graph: CircuitGraph;
  private simulator: CircuitSimulator;
  private wireManager: WireManager;
  private componentFactory: ComponentFactory;
  private questSystem: QuestSystem;
  private simState: SimState;

  private viewport: Viewport = { offsetX: 0, offsetY: 0, scale: 1 };
  private panningViewport = false;
  private panStart: { x: number; y: number; ox: number; oy: number } | null = null;

  private availableComponents: ComponentType[] = DEFAULT_AVAILABLE_COMPONENTS;
  private selectedTool: ComponentType | null = null;
  private mouseWorld: { x: number; y: number } = { x: 0, y: 0 };
  private mouseScreen: { x: number; y: number } = { x: 0, y: 0 };

  private draggingComponent: ComponentId | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private selectedComponent: ComponentId | null = null;
  private selectedWire: WireId | null = null;
  private hoverPin: Pin | null = null;

  private wiringFromPin: { componentId: ComponentId; pinIndex: number } | null = null;
  private wiringTempEnd: { x: number; y: number } | null = null;

  private undoStack: UndoAction[] = [];
  private redoStack: UndoAction[] = [];

  private simAccumulator = 0;
  private startTime = 0;
  private elapsedMs = 0;
  private lastGoalCompleteTime = 0;

  constructor(eventBus: EventBus, sceneManager: SceneManager, saveSystem: SaveSystem, telemetry: Telemetry) {
    super('game', eventBus);
    this.sceneManager = sceneManager;
    this.saveSystem = saveSystem;
    this.telemetry = telemetry;
    this.graph = this.createEmptyGraph();
    this.simulator = new CircuitSimulator();
    this.wireManager = new WireManager();
    this.componentFactory = new ComponentFactory();
    this.questSystem = new QuestSystem();
    this.simState = this.buildInitialSimState();
  }

  enter(payload?: GameScenePayload): void {
    if (payload) this.payload = payload;
    this.startTime = Date.now();
    this.elapsedMs = 0;
    this.lastGoalCompleteTime = 0;
    this.graph = this.createEmptyGraph();
    this.simulator.reset();
    this.simulator.setRunning(true);
    this.simState = this.buildInitialSimState();
    this.undoStack = [];
    this.redoStack = [];
    this.selectedTool = null;
    this.selectedComponent = null;
    this.selectedWire = null;
    this.draggingComponent = null;
    this.wiringFromPin = null;
    this.wiringTempEnd = null;
    this.hoverPin = null;
    this.viewport = { offsetX: 0, offsetY: 0, scale: 1 };
    const modeName = this.payload.mode + (this.payload.levelId ? `:${this.payload.levelId}` : '');
    this.telemetry.beginSession(modeName, this.payload.levelId);

    if (this.payload.mode === 'level' && this.payload.levelId) {
      this.questLevel = this.questSystem.loadLevel(this.payload.levelId);
      this.availableComponents = this.questSystem.getAvailableComponents();
      if (this.questLevel?.initialComponents) {
        for (const ic of this.questLevel.initialComponents) {
          const t = ic.type as ComponentType;
          const x = ic.x ?? roundToGrid(GRID_SIZE, this.width / 2);
          const y = ic.y ?? roundToGrid(GRID_SIZE, this.height / 2);
          this.doAddComponent(this.componentFactory.createComponent(t, x, y, ic.rotation ?? 0), false);
        }
      }
    } else {
      this.questLevel = null;
      this.questSystem.goals = [];
      this.availableComponents = DEFAULT_AVAILABLE_COMPONENTS;
    }
    this.subscribeInput();
    this.buildUI();
    this.refreshHUD();
  }

  exit(): void {
    this.removeUI();
    this.inputUnsubscribe.forEach(u => u());
    this.inputUnsubscribe = [];
    this.telemetry.endSession({ mode: this.payload.mode, levelId: this.payload.levelId, elapsedMs: this.elapsedMs });
  }

  onResize(width: number, height: number): void { super.onResize(width, height); }

  private createEmptyGraph(): CircuitGraph {
    return { components: new Map(), wires: new Map(), nodes: new Map() };
  }
  private buildInitialSimState(): SimState {
    return { running: true, time: 0, nodeVoltages: new Map(), componentStates: new Map(), errors: [] };
  }

  private subscribeInput(): void {
    const bus = this.eventBus as any;
    const wrap = (evt: string, handler: (p: any) => void) => {
      const u = bus.on?.(evt, handler);
      if (typeof u === 'function') this.inputUnsubscribe.push(u);
    };
    wrap('pointer_move', (e: PointerEvent) => this.onPointerMove(e));
    wrap('pointer_down', (e: PointerEvent) => this.onPointerDown(e));
    wrap('pointer_up', (e: PointerEvent) => this.onPointerUp(e));
    wrap('key_down', (e: KeyInputEvent) => this.onKeyDown(e));
    wrap('cancel', () => this.onCancel());
  }

  update(dt: number): void {
    this.elapsedMs = Date.now() - this.startTime;
    if (this.simState.running) {
      this.simAccumulator += dt * 1000;
      while (this.simAccumulator >= SIM_STEP_MS) {
        this.simState = this.simulator.step(SIM_STEP_MS / 1000, this.graph);
        this.simAccumulator -= SIM_STEP_MS;
        if (this.simAccumulator > 200) this.simAccumulator = 0;
      }
    }
    if (this.questSystem.goals.length > 0) {
      const r = this.questSystem.update(this.graph, this.simState);
      if (r.changed) {
        this.refreshHUD();
        if (r.allCompleted && this.lastGoalCompleteTime === 0) {
          this.lastGoalCompleteTime = this.elapsedMs;
          this.telemetry.recordEvent('goal_complete', { all: true, timeMs: this.elapsedMs });
          if (this.payload.mode === 'level') this.handleLevelComplete();
        }
      }
    }
    if (this.questLevel) {
      for (const err of this.simState.errors) {
        if (err.severity === 'error') this.telemetry.recordEvent('mistake', { type: err.type, message: err.message });
      }
    }
  }

  private handleLevelComplete(): void {
    if (!this.questLevel) return;
    const stars = this.questSystem.calculateStars(this.elapsedMs, this.simState, this.graph);
    const progress = this.saveSystem.get<any>('levelProgress') || { completed: [], stars: {}, bestTime: {} };
    if (!progress.completed.includes(this.questLevel.id)) progress.completed.push(this.questLevel.id);
    progress.stars[this.questLevel.id] = Math.max(progress.stars[this.questLevel.id] || 0, stars);
    progress.bestTime[this.questLevel.id] = Math.min(progress.bestTime[this.questLevel.id] || Infinity, this.elapsedMs);
    this.saveSystem.set('levelProgress', progress);
    setTimeout(() => {
      this.sceneManager.replace('result', {
        mode: 'level', levelId: this.questLevel!.id, levelName: this.questLevel!.name, stars,
        timeMs: this.elapsedMs,
        goalsCompleted: this.questSystem.goals.filter(g => g.completed).length,
        totalGoals: this.questSystem.goals.length,
        mistakes: this.telemetry.getStat('mistakes'),
        componentsUsed: this.graph.components.size, wiresUsed: this.graph.wires.size,
      });
    }, 1200);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(this.viewport.offsetX, this.viewport.offsetY);
    ctx.scale(this.viewport.scale, this.viewport.scale);
    this.drawGrid(ctx);
    this.drawWires(ctx);
    this.drawComponents(ctx);
    this.drawWirePreview(ctx);
    this.drawComponentPreview(ctx);
    this.drawSelection(ctx);
    ctx.restore();
    this.drawMinimap(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const s = this.viewport.scale; if (s < 0.3) return;
    const inv = 1 / s; const gs = GRID_SIZE;
    const left = -this.viewport.offsetX * inv - 100;
    const right = left + (this.width * inv) + 200;
    const top = -this.viewport.offsetY * inv - 100;
    const bottom = top + (this.height * inv) + 200;
    const sx = Math.floor(left / gs) * gs;
    const sy = Math.floor(top / gs) * gs;
    ctx.lineWidth = 1 * inv;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath();
    for (let x = sx; x <= right; x += gs) { ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
    for (let y = sy; y <= bottom; y += gs) { ctx.moveTo(left, y); ctx.lineTo(right, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    for (let x = sx; x <= right; x += gs * 5) { ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
    for (let y = sy; y <= bottom; y += gs * 5) { ctx.moveTo(left, y); ctx.lineTo(right, y); }
    ctx.stroke();
  }

  private drawWires(ctx: CanvasRenderingContext2D): void {
    const inv = 1 / this.viewport.scale;
    for (const wire of this.graph.wires.values()) {
      const from = this.getPinWorldPosition(wire.fromNode);
      const to = this.getPinWorldPosition(wire.toNode);
      if (!from || !to) continue;
      const midX = (from.x + to.x) / 2;
      const v = this.simState.nodeVoltages.get(wire.fromNode) ?? 0;
      const color = v > 0.1 ? `rgba(${Math.floor(74 + v * 30)}, ${Math.floor(222 - v * 10)}, ${Math.floor(128 + v * 10)}, 0.9)` : 'rgba(148, 163, 184, 0.7)';
      ctx.strokeStyle = color; ctx.lineWidth = 4 * inv; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(from.x, from.y);
      ctx.bezierCurveTo(midX, from.y, midX, to.y, to.x, to.y); ctx.stroke();
      if (wire.id === this.selectedWire) {
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 8 * inv; ctx.globalAlpha = 0.3; ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (v > 0.1 && this.simState.running) {
        for (let i = 0; i < 3; i++) {
          const t = ((performance.now() / 400) + i / 3) % 1;
          const cx = lerp(from.x, midX, t), cy = lerp(from.y, from.y, t);
          const dx = lerp(cx, midX, t), dy = lerp(cy, to.y, t);
          const fx = lerp(dx, to.x, t), fy = lerp(dy, to.y, t);
          ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(fx, fy, 4 * inv, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  private drawComponents(ctx: CanvasRenderingContext2D): void {
    const inv = 1 / this.viewport.scale;
    for (const comp of this.graph.components.values()) {
      ctx.save(); ctx.translate(comp.x, comp.y); ctx.rotate((comp.rotation * Math.PI) / 180);
      const state = this.simState.componentStates.get(comp.id) || {};
      this.drawComponentBody(ctx, comp, state);
      for (const pin of comp.pins) {
        const v = this.simState.nodeVoltages.get(pin.nodeId) ?? 0;
        ctx.fillStyle = v > 0.1 ? '#ef4444' : '#64748b';
        ctx.beginPath(); ctx.arc(pin.localX, pin.localY, PIN_RADIUS * inv, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2 * inv; ctx.stroke();
        if (v > 0.1) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.beginPath(); ctx.arc(pin.localX, pin.localY, PIN_RADIUS * inv * 1.8, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      if (comp.id === this.selectedComponent) {
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2 * inv;
        ctx.setLineDash([6 * inv, 4 * inv]);
        ctx.strokeRect(comp.x - COMPONENT_WIDTH / 2 - 6, comp.y - COMPONENT_HEIGHT / 2 - 6, COMPONENT_WIDTH + 12, COMPONENT_HEIGHT + 12);
        ctx.setLineDash([]);
      }
    }
  }

  private drawComponentBody(ctx: CanvasRenderingContext2D, comp: BaseComponent, state: Record<string, number | boolean>): void {
    const w = COMPONENT_WIDTH, h = COMPONENT_HEIGHT;
    const inv = 1 / this.viewport.scale;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2 * inv;
    switch (comp.type) {
      case 'battery':
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-w / 2, -h / 2 + 10, w, h - 20);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(-w / 2, -h / 2 + 10, 12, h - 20);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(w / 2 - 12, -h / 2 + 10, 12, h - 20);
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(w / 2, -6, 8, 12);
        ctx.fillStyle = '#f1f5f9'; ctx.font = `bold ${12 * inv}px system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${(comp.params.voltage as number).toFixed(1)}V`, 0, 0);
        break;
      case 'resistor':
        ctx.strokeStyle = '#d4a373'; ctx.lineWidth = 4 * inv; ctx.beginPath();
        ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2 + 10, 0);
        for (let i = 0; i < 5; i++) {
          const sx = -w / 2 + 10 + i * 12;
          ctx.lineTo(sx + 3, -8); ctx.lineTo(sx + 9, 8);
        }
        ctx.lineTo(w / 2, 0); ctx.stroke();
        ctx.fillStyle = '#f1f5f9'; ctx.font = `${10 * inv}px system-ui, sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(`${comp.params.resistance as number}Ω`, 0, h / 2 - 4);
        break;
      case 'capacitor':
        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 3 * inv; ctx.beginPath();
        ctx.moveTo(-w / 2, 0); ctx.lineTo(-8, 0); ctx.moveTo(8, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-10, -h / 2 + 10, 4, h - 20); ctx.fillRect(6, -h / 2 + 10, 4, h - 20);
        ctx.fillStyle = '#f1f5f9'; ctx.font = `${9 * inv}px system-ui, sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(`${((comp.params.capacitance as number) * 1000).toFixed(0)}uF`, 0, h / 2 - 4);
        break;
      case 'switch': {
        const closed = (comp.params.closed as boolean) || (state.closed as boolean);
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3 * inv; ctx.beginPath();
        ctx.moveTo(-w / 2, 0); ctx.lineTo(-8, 0); ctx.moveTo(8, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
        ctx.fillStyle = closed ? '#22c55e' : '#ef4444'; ctx.beginPath();
        ctx.arc(-8, 0, 5 * inv, 0, Math.PI * 2); ctx.arc(8, 0, 5 * inv, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 4 * inv; ctx.beginPath();
        ctx.moveTo(-8, 0); closed ? ctx.lineTo(8, 0) : ctx.lineTo(8, -18); ctx.stroke();
        break;
      }
      case 'bulb': {
        const bright = (state.brightness as number) || 0;
        const r = 22 * inv;
        if (bright > 0.05) {
          const glow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.5);
          glow.addColorStop(0, `rgba(254, 240, 138, ${0.3 * bright})`);
          glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(0, -4, r, 0, Math.PI * 2);
        const fill = lerp(0.3, 1, bright);
        ctx.fillStyle = `rgba(255, 248, 200, ${fill})`; ctx.fill();
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2 * inv; ctx.stroke();
        if (bright > 0.1) {
          ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5 * inv;
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * r * 1.2, Math.sin(ang) * r * 1.2 - 4);
            ctx.lineTo(Math.cos(ang) * (r + 14 * inv * bright), Math.sin(ang) * (r + 14 * inv * bright) - 4);
            ctx.stroke();
          }
        }
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-10, h / 2 - 20, 20, 8);
        ctx.fillRect(-7, h / 2 - 12, 14, 6);
        ctx.fillRect(-4, h / 2 - 6, 8, 4);
        break;
      }
      case 'wire_joint':
        ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(0, 0, 8 * inv, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2 * inv; ctx.stroke();
        break;
    }
  }

  private drawWirePreview(ctx: CanvasRenderingContext2D): void {
    if (!this.wiringFromPin || !this.wiringTempEnd) return;
    const inv = 1 / this.viewport.scale;
    const start = this.getWiringStartPos(); if (!start) return;
    const midX = (start.x + this.wiringTempEnd.x) / 2;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)'; ctx.lineWidth = 3 * inv;
    ctx.setLineDash([8 * inv, 6 * inv]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(midX, start.y, midX, this.wiringTempEnd.y, this.wiringTempEnd.x, this.wiringTempEnd.y);
    ctx.stroke(); ctx.setLineDash([]);
  }

  private drawComponentPreview(ctx: CanvasRenderingContext2D): void {
    if (!this.selectedTool) return;
    const inv = 1 / this.viewport.scale;
    const snapped = snapToGrid(GRID_SIZE, this.mouseWorld.x, this.mouseWorld.y);
    ctx.save(); ctx.translate(snapped.x, snapped.y); ctx.globalAlpha = 0.5;
    const dummy = this.componentFactory.createComponent(this.selectedTool, 0, 0, 0);
    this.drawComponentBody(ctx, dummy, {});
    for (const pin of dummy.pins) {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.5)';
      ctx.beginPath(); ctx.arc(pin.localX, pin.localY, PIN_RADIUS * inv, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  private drawSelection(ctx: CanvasRenderingContext2D): void {
    const inv = 1 / this.viewport.scale;
    if (this.hoverPin) {
      const pos = this.getPinWorldPosition(this.hoverPin.nodeId);
      if (pos) {
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2 * inv;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, PIN_RADIUS * inv * 1.6, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  private drawMinimap(ctx: CanvasRenderingContext2D): void {
    const mw = 180, mh = 120, mx = this.width - mw - 16, my = 16;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 8); ctx.fill(); ctx.stroke();
    if (this.graph.components.size === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of this.graph.components.values()) {
      minX = Math.min(minX, c.x); minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x); maxY = Math.max(maxY, c.y);
    }
    if (maxX - minX < 100) { maxX = minX + 400; minX -= 200; }
    if (maxY - minY < 100) { maxY = minY + 400; minY -= 200; }
    const pad = 60; minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const ms = Math.min(mw / (maxX - minX), mh / (maxY - minY));
    const ox = mx + mw / 2 - ((minX + maxX) / 2) * ms;
    const oy = my + mh / 2 - ((minY + maxY) / 2) * ms;
    ctx.fillStyle = '#22c55e';
    for (const c of this.graph.components.values()) { ctx.fillRect(ox + c.x * ms - 1, oy + c.y * ms - 1, 3, 3); }
    ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 0.5;
    for (const w of this.graph.wires.values()) {
      const f = this.getPinWorldPosition(w.fromNode), t = this.getPinWorldPosition(w.toNode);
      if (!f || !t) continue;
      ctx.beginPath(); ctx.moveTo(ox + f.x * ms, oy + f.y * ms); ctx.lineTo(ox + t.x * ms, oy + t.y * ms); ctx.stroke();
    }
    const vx = -this.viewport.offsetX / this.viewport.scale, vy = -this.viewport.offsetY / this.viewport.scale;
    const vw = this.width / this.viewport.scale, vh = this.height / this.viewport.scale;
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.strokeRect(ox + vx * ms, oy + vy * ms, vw * ms, vh * ms);
  }

  private onPointerMove(e: PointerEvent): void {
    this.mouseScreen = { ...e.pos };
    this.mouseWorld = this.screenToWorld(e.pos.x, e.pos.y);
    if (this.panningViewport && this.panStart) {
      this.viewport.offsetX = this.panStart.ox + (e.pos.x - this.panStart.x);
      this.viewport.offsetY = this.panStart.oy + (e.pos.y - this.panStart.y);
      return;
    }
    if (this.draggingComponent) {
      const comp = this.graph.components.get(this.draggingComponent);
      if (comp) {
        const snapped = snapToGrid(GRID_SIZE, this.mouseWorld.x + this.dragOffset.x, this.mouseWorld.y + this.dragOffset.y);
        if (snapped.x !== comp.x || snapped.y !== comp.y) { comp.x = snapped.x; comp.y = snapped.y; }
      }
      return;
    }
    if (this.wiringFromPin) {
      const hovered = this.findPinAt(this.mouseWorld.x, this.mouseWorld.y);
      this.hoverPin = hovered?.pin ?? null;
      if (hovered && hovered.pin.nodeId !== this.getWiringStartPinNode()) {
        this.wiringTempEnd = this.getPinWorldPosition(hovered.pin.nodeId);
      } else {
        this.wiringTempEnd = { ...this.mouseWorld };
      }
    } else {
      this.hoverPin = this.findPinAt(this.mouseWorld.x, this.mouseWorld.y)?.pin ?? null;
    }
  }

  private onPointerDown(e: PointerEvent): void {
    this.mouseScreen = { ...e.pos };
    this.mouseWorld = this.screenToWorld(e.pos.x, e.pos.y);
    if (e.button === 1) {
      this.panningViewport = true;
      this.panStart = { x: e.pos.x, y: e.pos.y, ox: this.viewport.offsetX, oy: this.viewport.offsetY };
      return;
    }
    if (e.button !== 0) return;
    if (this.selectedTool) {
      const snapped = snapToGrid(GRID_SIZE, this.mouseWorld.x, this.mouseWorld.y);
      const comp = this.componentFactory.createComponent(this.selectedTool, snapped.x, snapped.y, 0);
      this.doAddComponent(comp, true);
      if (!this.isKeyHeld('shift')) { this.selectedTool = null; this.refreshHUD(); }
      return;
    }
    if (this.wiringFromPin) {
      const hovered = this.findPinAt(this.mouseWorld.x, this.mouseWorld.y);
      if (hovered && hovered.pin.nodeId !== this.getWiringStartPinNode()) {
        this.doAddWire(this.getWiringStartPinNode()!, hovered.pin.nodeId);
      }
      this.wiringFromPin = null; this.wiringTempEnd = null; this.hoverPin = null;
      return;
    }
    const pinHit = this.findPinAt(this.mouseWorld.x, this.mouseWorld.y);
    if (pinHit) {
      this.wiringFromPin = { componentId: pinHit.componentId, pinIndex: pinHit.pinIndex };
      this.wiringTempEnd = this.getPinWorldPosition(pinHit.pin.nodeId);
      this.telemetry.recordEvent('wire_start');
      return;
    }
    const compHit = this.findComponentAt(this.mouseWorld.x, this.mouseWorld.y);
    if (compHit) {
      this.selectedComponent = compHit.id; this.selectedWire = null; this.draggingComponent = compHit.id;
      this.dragOffset = { x: compHit.x - this.mouseWorld.x, y: compHit.y - this.mouseWorld.y };
      this.pushUndo({ kind: 'move_component', componentId: compHit.id, fromX: compHit.x, fromY: compHit.y, toX: compHit.x, toY: compHit.y });
      return;
    }
    const wireHit = this.findWireAt(this.mouseWorld.x, this.mouseWorld.y);
    if (wireHit) { this.selectedWire = wireHit.id; this.selectedComponent = null; return; }
    this.selectedComponent = null; this.selectedWire = null; this.refreshHUD();
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.panningViewport) { this.panningViewport = false; this.panStart = null; return; }
    if (this.draggingComponent) {
      const comp = this.graph.components.get(this.draggingComponent);
      if (comp && this.undoStack.length > 0) {
        const top = this.undoStack[this.undoStack.length - 1];
        if (top.kind === 'move_component' && top.componentId === comp.id) {
          if (top.fromX === comp.x && top.fromY === comp.y) this.undoStack.pop();
          else { top.toX = comp.x; top.toY = comp.y; }
        }
      }
      this.draggingComponent = null; this.redoStack = [];
    }
  }

  private onKeyDown(e: KeyInputEvent): void {
    const t = COMPONENT_SHORTCUTS[e.key];
    if (t && this.availableComponents.includes(t)) {
      this.selectedTool = this.selectedTool === t ? null : t;
      this.wiringFromPin = null; this.wiringTempEnd = null; this.refreshHUD(); return;
    }
    if (e.code === 'Space') {
      e.preventDefault?.();
      this.simState.running = !this.simState.running;
      this.simulator.setRunning(this.simState.running);
      this.telemetry.recordEvent(this.simState.running ? 'sim_start' : 'sim_stop'); this.refreshHUD(); return;
    }
    if (e.ctrl && e.key === 'z') { e.preventDefault?.(); this.undo(); return; }
    if (e.ctrl && (e.key === 'y' || (e.shift && e.key === 'z'))) { e.preventDefault?.(); this.redo(); return; }
    if (e.code === 'Delete' || e.code === 'Backspace') {
      if (this.selectedComponent) { this.doRemoveComponent(this.selectedComponent, true); this.selectedComponent = null; this.refreshHUD(); }
      else if (this.selectedWire) { this.doRemoveWire(this.selectedWire, true); this.selectedWire = null; this.refreshHUD(); }
      return;
    }
    if (e.key === 'r' && this.selectedComponent) {
      const comp = this.graph.components.get(this.selectedComponent); if (!comp) return;
      comp.rotation = (comp.rotation + 90) % 360;
      const origs = this.getOriginalPinPositions(comp.type);
      for (let i = 0; i < comp.pins.length; i++) {
        if (origs[i]) {
          const rp = rotatePoint(origs[i].dx, origs[i].dy, 0, 0, comp.rotation);
          comp.pins[i].localX = rp.x; comp.pins[i].localY = rp.y;
        }
      }
    }
    if (e.key === 'f' && this.selectedComponent) {
      const comp = this.graph.components.get(this.selectedComponent); if (comp?.type === 'switch') {
        const before = comp.params.closed as boolean, after = !before;
        comp.params.closed = after; comp.state.closed = after;
        this.pushUndo({ kind: 'toggle_switch', componentId: comp.id, from: before, to: after }); this.redoStack = [];
      }
    }
  }

  private onCancel(): void {
    this.selectedTool = null; this.wiringFromPin = null; this.wiringTempEnd = null;
    this.selectedComponent = null; this.selectedWire = null; this.hoverPin = null; this.refreshHUD();
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - this.viewport.offsetX) / this.viewport.scale, y: (sy - this.viewport.offsetY) / this.viewport.scale };
  }

  private getOriginalPinPositions(type: ComponentType): { dx: number; dy: number }[] {
    return ({
      battery: [{ dx: -COMPONENT_WIDTH / 2, dy: 0 }, { dx: COMPONENT_WIDTH / 2, dy: 0 }],
      resistor: [{ dx: -COMPONENT_WIDTH / 2, dy: 0 }, { dx: COMPONENT_WIDTH / 2, dy: 0 }],
      capacitor: [{ dx: -COMPONENT_WIDTH / 2, dy: 0 }, { dx: COMPONENT_WIDTH / 2, dy: 0 }],
      switch: [{ dx: -COMPONENT_WIDTH / 2, dy: 0 }, { dx: COMPONENT_WIDTH / 2, dy: 0 }],
      bulb: [{ dx: -COMPONENT_WIDTH / 2 + 10, dy: COMPONENT_HEIGHT / 2 }, { dx: COMPONENT_WIDTH / 2 - 10, dy: COMPONENT_HEIGHT / 2 }],
      wire_joint: [{ dx: 0, dy: 0 }],
    } as Record<ComponentType, { dx: number; dy: number }[]>)[type] || [];
  }

  private getPinWorldPosition(nodeId: NodeId): { x: number; y: number } | null {
    for (const comp of this.graph.components.values()) {
      for (const pin of comp.pins) {
        if (pin.nodeId === nodeId) {
          const rot = rotatePoint(pin.localX, pin.localY, 0, 0, comp.rotation);
          return { x: comp.x + rot.x, y: comp.y + rot.y };
        }
      }
    }
    return null;
  }

  private findPinAt(wx: number, wy: number): { pin: Pin; componentId: ComponentId; pinIndex: number } | null {
    const th = PIN_RADIUS * 1.5;
    for (const comp of this.graph.components.values()) {
      for (let i = 0; i < comp.pins.length; i++) {
        const pin = comp.pins[i]; const pos = this.getPinWorldPosition(pin.nodeId);
        if (pos && dist(wx, wy, pos.x, pos.y) <= th) return { pin, componentId: comp.id, pinIndex: i };
      }
    }
    return null;
  }

  private findComponentAt(wx: number, wy: number): BaseComponent | null {
    for (const comp of Array.from(this.graph.components.values()).reverse()) {
      if (pointInRect(wx, wy, comp.x - COMPONENT_WIDTH / 2, comp.y - COMPONENT_HEIGHT / 2, COMPONENT_WIDTH, COMPONENT_HEIGHT)) return comp;
    }
    return null;
  }

  private findWireAt(wx: number, wy: number): Wire | null {
    const th = 10;
    for (const wire of this.graph.wires.values()) {
      const from = this.getPinWorldPosition(wire.fromNode), to = this.getPinWorldPosition(wire.toNode);
      if (!from || !to) continue;
      for (let t = 0; t <= 1; t += 0.05) {
        if (dist(wx, wy, lerp(from.x, to.x, t), lerp(from.y, to.y, t)) <= th) return wire;
      }
    }
    return null;
  }

  private getWiringStartPos(): { x: number; y: number } | null {
    if (!this.wiringFromPin) return null;
    const comp = this.graph.components.get(this.wiringFromPin.componentId); if (!comp) return null;
    return this.getPinWorldPosition(comp.pins[this.wiringFromPin.pinIndex]?.nodeId ?? '');
  }

  private getWiringStartPinNode(): NodeId | null {
    if (!this.wiringFromPin) return null;
    const comp = this.graph.components.get(this.wiringFromPin.componentId); if (!comp) return null;
    return comp.pins[this.wiringFromPin.pinIndex]?.nodeId ?? null;
  }

  private registerComponentNodes(comp: BaseComponent): void {
    for (const pin of comp.pins) {
      if (!this.graph.nodes.has(pin.nodeId)) this.graph.nodes.set(pin.nodeId, { voltage: 0, components: new Set() });
      this.graph.nodes.get(pin.nodeId)!.components.add(comp.id);
    }
  }

  private unregisterComponentNodes(comp: BaseComponent): void {
    for (const pin of comp.pins) {
      const node = this.graph.nodes.get(pin.nodeId); if (!node) continue;
      node.components.delete(comp.id);
      if (node.components.size === 0) this.graph.nodes.delete(pin.nodeId);
    }
  }

  private doAddComponent(comp: BaseComponent, recordUndo: boolean): void {
    this.graph.components.set(comp.id, comp); this.registerComponentNodes(comp);
    if (recordUndo) {
      this.pushUndo({ kind: 'add_component', component: this.deepCloneComponent(comp) }); this.redoStack = [];
      this.telemetry.recordEvent('component_add', { type: comp.type, id: comp.id });
    }
    this.refreshHUD();
  }

  private doRemoveComponent(id: ComponentId, recordUndo: boolean): void {
    const comp = this.graph.components.get(id); if (!comp) return;
    const wires: Wire[] = [];
    for (const wire of Array.from(this.graph.wires.values())) {
      const fc = this.getComponentForNode(wire.fromNode), tc = this.getComponentForNode(wire.toNode);
      if (fc === id || tc === id) { wires.push(wire); this.graph.wires.delete(wire.id); }
    }
    this.graph.components.delete(id); this.unregisterComponentNodes(comp);
    if (recordUndo) {
      this.pushUndo({ kind: 'remove_component', component: this.deepCloneComponent(comp), wires: wires.map(w => ({ ...w })) });
      this.redoStack = [];
      this.telemetry.recordEvent('component_remove', { type: comp.type, id: comp.id });
    }
    this.refreshHUD();
  }

  private doAddWire(from: NodeId, to: NodeId): void {
    if (from === to) { this.telemetry.recordEvent('mistake', { type: 'self_wire' }); return; }
    for (const wire of this.graph.wires.values()) {
      if ((wire.fromNode === from && wire.toNode === to) || (wire.fromNode === to && wire.toNode === from)) return;
    }
    const wire = this.wireManager.createWire(from, to); this.graph.wires.set(wire.id, wire);
    this.pushUndo({ kind: 'add_wire', wire: { ...wire } }); this.redoStack = [];
    this.telemetry.recordEvent('wire_add', { id: wire.id, from, to });
    this.refreshHUD();
  }

  private doRemoveWire(id: WireId, recordUndo: boolean): void {
    const wire = this.graph.wires.get(id); if (!wire) return;
    this.graph.wires.delete(id);
    if (recordUndo) { this.pushUndo({ kind: 'remove_wire', wire: { ...wire } }); this.redoStack = []; this.telemetry.recordEvent('wire_remove', { id }); }
    this.refreshHUD();
  }

  private getComponentForNode(nodeId: NodeId): ComponentId | null {
    for (const comp of this.graph.components.values()) {
      for (const pin of comp.pins) { if (pin.nodeId === nodeId) return comp.id; }
    }
    return null;
  }

  private deepCloneComponent(c: BaseComponent): BaseComponent {
    return { ...c, pins: c.pins.map(p => ({ ...p })), params: { ...c.params }, state: { ...c.state } };
  }

  private pushUndo(a: UndoAction): void {
    this.undoStack.push(a);
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
  }

  private undo(): void {
    const a = this.undoStack.pop(); if (!a) return;
    this.executeAction(a, true); this.redoStack.push(a); this.refreshHUD();
  }

  private redo(): void {
    const a = this.redoStack.pop(); if (!a) return;
    this.executeAction(a, false); this.undoStack.push(a); this.refreshHUD();
  }

  private executeAction(a: UndoAction, reverse: boolean): void {
    switch (a.kind) {
      case 'add_component':
        reverse ? this.doRemoveComponent(a.component.id, false) : this.doAddComponent(this.deepCloneComponent(a.component), false);
        break;
      case 'remove_component':
        if (reverse) {
          this.doAddComponent(this.deepCloneComponent(a.component), false);
          for (const w of a.wires) this.graph.wires.set(w.id, { ...w });
        } else this.doRemoveComponent(a.component.id, false);
        break;
      case 'move_component': {
        const c = this.graph.components.get(a.componentId); if (!c) break;
        const from = reverse ? { x: a.toX, y: a.toY } : { x: a.fromX, y: a.fromY };
        const to = reverse ? { x: a.fromX, y: a.fromY } : { x: a.toX, y: a.toY };
        c.x = to.x; c.y = to.y; void from;
        break;
      }
      case 'toggle_switch': {
        const c = this.graph.components.get(a.componentId); if (c?.type === 'switch') {
          const v = reverse ? a.from : a.to; c.params.closed = v; c.state.closed = v;
        }
        break;
      }
      case 'add_wire':
        reverse ? this.doRemoveWire(a.wire.id, false) : this.graph.wires.set(a.wire.id, { ...a.wire });
        break;
      case 'remove_wire':
        reverse ? this.graph.wires.set(a.wire.id, { ...a.wire }) : this.doRemoveWire(a.wire.id, false);
        break;
    }
  }

  private isKeyHeld(key: string): boolean { return this._inputManager?.isKeyDown(key) ?? false; }
  setInputManager(im: InputManager): void { this._inputManager = im; }

  handleWheel(e: WheelEvent): void {
    const delta = -e.deltaY * 0.001;
    const os = this.viewport.scale, ns = clamp(os * (1 + delta), 0.25, 3);
    const wx = (e.offsetX - this.viewport.offsetX) / os, wy = (e.offsetY - this.viewport.offsetY) / os;
    this.viewport.scale = ns;
    this.viewport.offsetX = e.offsetX - wx * ns; this.viewport.offsetY = e.offsetY - wy * ns;
  }

  handlePinch(delta: number, cx: number, cy: number): void {
    const os = this.viewport.scale, ns = clamp(os * delta, 0.25, 3);
    const wx = (cx - this.viewport.offsetX) / os, wy = (cy - this.viewport.offsetY) / os;
    this.viewport.scale = ns;
    this.viewport.offsetX = cx - wx * ns; this.viewport.offsetY = cy - wy * ns;
  }

  private buildUI(): void {
    if (!this.uiRoot) return;
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;font-family:system-ui,sans-serif;';

    const topBar = document.createElement('div');
    topBar.style.cssText = 'position:absolute;top:0;left:0;right:0;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;pointer-events:auto;background:linear-gradient(180deg,rgba(10,15,26,0.95),rgba(10,15,26,0));';
    this.uiContainer.appendChild(topBar);

    const left = document.createElement('div');
    left.style.cssText = 'display:flex;gap:12px;align-items:center;';
    left.innerHTML = `
      <button id="game-back" style="padding:8px 14px;border:1px solid rgba(148,163,184,0.25);border-radius:8px;background:rgba(15,23,42,0.8);color:#94a3b8;cursor:pointer;font-size:13px;transition:all .2s;">← 退出</button>
      <div id="game-title" style="color:#e2e8f0;font-weight:600;font-size:14px;"></div>
    `;
    topBar.appendChild(left);

    const center = document.createElement('div');
    center.id = 'game-center';
    center.style.cssText = 'display:flex;gap:20px;align-items:center;';
    topBar.appendChild(center);

    const right = document.createElement('div');
    right.style.cssText = 'display:flex;gap:8px;align-items:center;';
    right.innerHTML = `
      <button id="btn-undo" title="撤销 (Ctrl+Z)" style="padding:8px 10px;border:1px solid rgba(148,163,184,0.25);border-radius:8px;background:rgba(15,23,42,0.8);color:#94a3b8;cursor:pointer;font-size:14px;">↶</button>
      <button id="btn-redo" title="重做 (Ctrl+Y)" style="padding:8px 10px;border:1px solid rgba(148,163,184,0.25);border-radius:8px;background:rgba(15,23,42,0.8);color:#94a3b8;cursor:pointer;font-size:14px;">↷</button>
      <button id="btn-sim" title="仿真开关 (Space)" style="padding:8px 14px;border:1px solid rgba(74,222,128,0.5);border-radius:8px;background:rgba(21,128,61,0.2);color:#4ade80;cursor:pointer;font-weight:600;font-size:13px;">▶ 运行中</button>
      <button id="btn-delete" title="删除 (Delete)" style="padding:8px 10px;border:1px solid rgba(239,68,68,0.3);border-radius:8px;background:rgba(15,23,42,0.8);color:#ef4444;cursor:pointer;font-size:14px;">🗑</button>
    `;
    topBar.appendChild(right);

    const tools = document.createElement('div');
    tools.id = 'game-tools';
    tools.style.cssText = 'position:absolute;left:16px;top:72px;width:84px;padding:8px;border-radius:12px;background:rgba(15,23,42,0.85);backdrop-filter:blur(8px);border:1px solid rgba(56,189,248,0.15);pointer-events:auto;display:flex;flex-direction:column;gap:8px;';
    this.uiContainer.appendChild(tools);

    const goals = document.createElement('div');
    goals.id = 'game-goals';
    goals.style.cssText = 'position:absolute;right:16px;top:150px;width:260px;padding:14px;border-radius:12px;background:rgba(15,23,42,0.85);backdrop-filter:blur(8px);border:1px solid rgba(168,85,247,0.15);pointer-events:auto;display:none;';
    this.uiContainer.appendChild(goals);

    const info = document.createElement('div');
    info.id = 'game-info';
    info.style.cssText = 'position:absolute;left:16px;bottom:16px;padding:10px 14px;border-radius:10px;background:rgba(15,23,42,0.8);border:1px solid rgba(100,116,139,0.2);pointer-events:auto;color:#94a3b8;font-size:12px;line-height:1.6;';
    info.innerHTML = `
      <div><strong style="color:#cbd5e1;">操作提示</strong></div>
      <div>1-6 选择元件 · 点击放置</div>
      <div>点击引脚→另一引脚 连线</div>
      <div>拖拽移动 · 中键平移 · 滚轮缩放</div>
      <div>R 旋转 · F 切换开关 · Del 删除</div>
      <div>Space 仿真 · Ctrl+Z 撤销</div>
    `;
    this.uiContainer.appendChild(info);

    const errors = document.createElement('div');
    errors.id = 'game-errors';
    errors.style.cssText = 'position:absolute;right:16px;bottom:16px;max-width:320px;pointer-events:auto;display:flex;flex-direction:column;gap:6px;';
    this.uiContainer.appendChild(errors);

    const selectedInfo = document.createElement('div');
    selectedInfo.id = 'game-selected';
    selectedInfo.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:16px;padding:10px 16px;border-radius:10px;background:rgba(15,23,42,0.85);border:1px solid rgba(245,158,11,0.3);pointer-events:auto;color:#e2e8f0;font-size:13px;display:none;';
    this.uiContainer.appendChild(selectedInfo);

    this.uiRoot.appendChild(this.uiContainer);

    left.querySelector('#game-back')?.addEventListener('click', () => {
      if (this.payload.mode === 'level') this.sceneManager.replace('level_select');
      else this.sceneManager.replace('main_menu');
    });
    right.querySelector('#btn-undo')?.addEventListener('click', () => this.undo());
    right.querySelector('#btn-redo')?.addEventListener('click', () => this.redo());
    const simBtn = right.querySelector('#btn-sim') as HTMLButtonElement | null;
    simBtn?.addEventListener('click', () => {
      this.simState.running = !this.simState.running;
      this.simulator.setRunning(this.simState.running);
      this.telemetry.recordEvent(this.simState.running ? 'sim_start' : 'sim_stop');
      this.refreshHUD();
    });
    right.querySelector('#btn-delete')?.addEventListener('click', () => {
      if (this.selectedComponent) { this.doRemoveComponent(this.selectedComponent, true); this.selectedComponent = null; this.refreshHUD(); }
      else if (this.selectedWire) { this.doRemoveWire(this.selectedWire, true); this.selectedWire = null; this.refreshHUD(); }
    });

    this.buildToolsPanel();
  }

  private buildToolsPanel(): void {
    const tools = this.uiContainer?.querySelector('#game-tools') as HTMLDivElement | null;
    if (!tools) return;
    let html = `<div style="font-size:11px;color:#64748b;text-align:center;margin-bottom:4px;padding-bottom:6px;border-bottom:1px solid rgba(100,116,139,0.15);">元件</div>`;
    const shortcutKeys = Object.entries(COMPONENT_SHORTCUTS);
    for (const [key, type] of shortcutKeys) {
      if (!this.availableComponents.includes(type)) continue;
      const isSel = this.selectedTool === type;
      html += `<button data-tool="${type}" title="${COMPONENT_NAMES[type]} (${key})" style="padding:8px 4px;border:1px solid ${isSel ? 'rgba(34,211,238,0.7)' : 'rgba(100,116,139,0.15)'};border-radius:8px;background:${isSel ? 'rgba(34,211,238,0.15)' : 'rgba(30,41,59,0.5)'};color:${isSel ? '#22d3ee' : '#e2e8f0'};cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;transition:all .15s;font-size:20px;">
        <span>${COMPONENT_ICONS[type]}</span>
        <span style="font-size:9px;color:#64748b;">${COMPONENT_NAMES[type]}<br/>[${key}]</span>
      </button>`;
    }
    tools.innerHTML = html;
    tools.querySelectorAll('button[data-tool]').forEach(b => {
      b.addEventListener('click', () => {
        const t = (b as HTMLElement).dataset.tool as ComponentType;
        this.selectedTool = this.selectedTool === t ? null : t;
        this.wiringFromPin = null;
        this.wiringTempEnd = null;
        this.buildToolsPanel();
      });
      b.addEventListener('mouseenter', () => { (b as HTMLElement).style.borderColor = 'rgba(34,211,238,0.4)'; });
      b.addEventListener('mouseleave', () => {
        const t = (b as HTMLElement).dataset.tool as ComponentType;
        (b as HTMLElement).style.borderColor = this.selectedTool === t ? 'rgba(34,211,238,0.7)' : 'rgba(100,116,139,0.15)';
      });
    });
  }

  private refreshHUD(): void {
    if (!this.uiContainer) return;
    const title = this.uiContainer.querySelector('#game-title') as HTMLDivElement | null;
    if (title) {
      if (this.payload.mode === 'level' && this.questLevel) {
        title.innerHTML = `📚 ${this.questLevel.name} <span style="color:#64748b;font-weight:400;font-size:12px;">| 关卡模式</span>`;
      } else if (this.payload.mode === 'sandbox') {
        title.innerHTML = `🛠 自由沙盒 <span style="color:#64748b;font-weight:400;font-size:12px;">| 无限创造</span>`;
      } else if (this.payload.mode === 'daily') {
        title.innerHTML = `📅 每日挑战 <span style="color:#64748b;font-weight:400;font-size:12px;">| ${this.payload.date || ''}</span>`;
      }
    }
    const center = this.uiContainer.querySelector('#game-center') as HTMLDivElement | null;
    if (center) {
      const mins = Math.floor(this.elapsedMs / 60000);
      const secs = Math.floor((this.elapsedMs % 60000) / 1000);
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      center.innerHTML = `
        <div style="padding:6px 14px;border-radius:8px;background:rgba(15,23,42,0.8);border:1px solid rgba(100,116,139,0.2);color:#e2e8f0;font-size:13px;">⏱ ${timeStr}</div>
        <div style="padding:6px 14px;border-radius:8px;background:rgba(15,23,42,0.8);border:1px solid rgba(56,189,248,0.2);color:#38bdf8;font-size:13px;">🧩 ${this.graph.components.size} 元件</div>
        <div style="padding:6px 14px;border-radius:8px;background:rgba(15,23,42,0.8);border:1px solid rgba(168,85,247,0.2);color:#a855f7;font-size:13px;">🔗 ${this.graph.wires.size} 连线</div>
      `;
    }
    const simBtn = this.uiContainer.querySelector('#btn-sim') as HTMLButtonElement | null;
    if (simBtn) {
      if (this.simState.running) {
        simBtn.textContent = '▶ 运行中';
        simBtn.style.borderColor = 'rgba(74,222,128,0.5)';
        simBtn.style.color = '#4ade80';
        simBtn.style.background = 'rgba(21,128,61,0.2)';
      } else {
        simBtn.textContent = '⏸ 已暂停';
        simBtn.style.borderColor = 'rgba(245,158,11,0.5)';
        simBtn.style.color = '#fbbf24';
        simBtn.style.background = 'rgba(146,64,14,0.2)';
      }
    }
    const goals = this.uiContainer.querySelector('#game-goals') as HTMLDivElement | null;
    if (goals) {
      if (this.questSystem.goals.length > 0) {
        goals.style.display = 'block';
        let ghtml = `<div style="font-weight:600;color:#e2e8f0;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(168,85,247,0.2);">🎯 关卡目标</div>`;
        for (const g of this.questSystem.goals) {
          ghtml += `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;color:${g.completed ? '#4ade80' : '#cbd5e1'};font-size:13px;line-height:1.4;">
            <span>${g.completed ? '✅' : '⬜'}</span>
            <span>${g.description}</span>
          </div>`;
        }
        goals.innerHTML = ghtml;
      } else {
        goals.style.display = 'none';
      }
    }
    const errorsEl = this.uiContainer.querySelector('#game-errors') as HTMLDivElement | null;
    if (errorsEl) {
      if (this.simState.errors.length > 0) {
        errorsEl.style.display = 'flex';
        errorsEl.innerHTML = this.simState.errors.slice(0, 3).map(e => `
          <div style="padding:8px 12px;border-radius:8px;background:${e.severity === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'};border:1px solid ${e.severity === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'};color:${e.severity === 'error' ? '#fca5a5' : '#fcd34d'};font-size:12px;line-height:1.4;">
            ${e.severity === 'error' ? '⛔' : '⚠️'} ${e.message}
          </div>
        `).join('');
      } else {
        errorsEl.style.display = 'none';
      }
    }
    const selEl = this.uiContainer.querySelector('#game-selected') as HTMLDivElement | null;
    if (selEl) {
      if (this.selectedComponent) {
        const comp = this.graph.components.get(this.selectedComponent);
        if (comp) {
          const state = this.simState.componentStates.get(comp.id) || {};
          selEl.style.display = 'block';
          let info = `${COMPONENT_ICONS[comp.type]} ${COMPONENT_NAMES[comp.type]}`;
          for (const [k, v] of Object.entries(state)) {
            if (typeof v === 'number') info += ` · ${k}:${v.toFixed(2)}`;
            else info += ` · ${k}:${v}`;
          }
          if (comp.type === 'switch') info += ` · 按 F 切换`;
          info += ` · 按 R 旋转`;
          selEl.textContent = info;
        }
      } else if (this.selectedWire) {
        selEl.style.display = 'block';
        selEl.textContent = `🔗 已选中连线 · 按 Delete 删除`;
      } else if (this.selectedTool) {
        selEl.style.display = 'block';
        selEl.textContent = `${COMPONENT_ICONS[this.selectedTool]} 放置 ${COMPONENT_NAMES[this.selectedTool]} · 点击画布放置（按住 Shift 连续放置）`;
      } else if (this.wiringFromPin) {
        selEl.style.display = 'block';
        selEl.textContent = `🔗 连线中 · 点击另一个引脚完成连线`;
      } else {
        selEl.style.display = 'none';
      }
    }
  }

  private removeUI(): void {
    if (this.uiContainer && this.uiRoot) {
      this.uiRoot.removeChild(this.uiContainer);
      this.uiContainer = null;
    }
  }

  setUIRoot(root: HTMLElement): void { this.uiRoot = root; }
}