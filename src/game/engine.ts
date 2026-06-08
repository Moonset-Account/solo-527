import type { LevelConfig, GridCell, Product, Position, Direction, BottleneckInfo, EngineResult } from "@/game/types";
import { MACHINE_TYPES } from "@/config/machines";

const STAGE_COLORS = ["#D4A84B", "#C45D2C", "#4A7C59", "#7B68AE", "#E8DCC8"];
const QA_QUALITY_THRESHOLD = 0.55;
const SPAWN_INTERVAL = 3.0;

interface InternalProduct {
  id: string;
  stage: number;
  quality: number;
  posX: number;
  posY: number;
  cellX: number;
  cellY: number;
  state: Product["state"];
  progress: number;
  timer: number;
  color: string;
  waitTimer: number;
}

interface MachineProcState {
  buffer: InternalProduct[];
  processing: InternalProduct | null;
  timer: number;
  processingTime: number;
  maxBuffer: number;
  machineType: string;
  level: number;
  direction: Direction;
}

function dirToOffset(dir: Direction): Position {
  switch (dir) {
    case "up": return { x: 0, y: -1 };
    case "down": return { x: 0, y: 1 };
    case "left": return { x: -1, y: 0 };
    case "right": return { x: 1, y: 0 };
  }
}

function isInBounds(x: number, y: number, grid: GridCell[][]): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < (grid[y]?.length ?? 0);
}

function getMachineKey(x: number, y: number): string {
  return `${x},${y}`;
}

export class GameEngine {
  private products: InternalProduct[] = [];
  private spawnTimer: number = 0;
  private productIdCounter: number = 0;
  private level: LevelConfig | null = null;
  private machineStates: Map<string, MachineProcState> = new Map();

  private _totalProduced: number = 0;
  private _totalDelivered: number = 0;
  private _consecutiveNoRejects: number = 0;
  private _deliveredThisFrame: number = 0;
  private _rejectedThisFrame: number = 0;

  init(level: LevelConfig) {
    this.level = level;
    this.products = [];
    this.spawnTimer = 0;
    this.productIdCounter = 0;
    this.machineStates.clear();
    this._totalProduced = 0;
    this._totalDelivered = 0;
    this._consecutiveNoRejects = 0;
  }

  registerMachine(x: number, y: number, type: string, level: number, direction: Direction) {
    const key = getMachineKey(x, y);
    const machineType = MACHINE_TYPES[type];
    if (!machineType) return;
    const processingTime = machineType.baseSpeed / Math.max(1, level);
    const maxBuffer = machineType.bufferCapacity + Math.floor((level - 1) / 3);
    this.machineStates.set(key, {
      buffer: [],
      processing: null,
      timer: 0,
      processingTime,
      maxBuffer,
      machineType: type,
      level,
      direction,
    });
  }

  unregisterMachine(x: number, y: number) {
    const key = getMachineKey(x, y);
    const state = this.machineStates.get(key);
    if (state) {
      for (const p of state.buffer) {
        this.removeProduct(p);
      }
      if (state.processing) {
        this.removeProduct(state.processing);
      }
      this.machineStates.delete(key);
    }
  }

  updateMachineLevel(x: number, y: number, newLevel: number) {
    const key = getMachineKey(x, y);
    const state = this.machineStates.get(key);
    if (!state) return;
    const machineType = MACHINE_TYPES[state.machineType];
    if (!machineType) return;
    state.level = newLevel;
    state.processingTime = machineType.baseSpeed / Math.max(1, newLevel);
    state.maxBuffer = machineType.bufferCapacity + Math.floor((newLevel - 1) / 3);
  }

  private removeProduct(product: InternalProduct) {
    const idx = this.products.indexOf(product);
    if (idx >= 0) this.products.splice(idx, 1);
  }

  update(deltaTime: number, grid: GridCell[][]): EngineResult {
    this._deliveredThisFrame = 0;
    this._rejectedThisFrame = 0;

    if (!this.level || grid.length === 0) return this.emptyResult();

    this.spawnProducts(deltaTime);

    this.updateMachineProcessing(deltaTime, grid);

    const toRemove: InternalProduct[] = [];
    for (const product of this.products) {
      const result = this.updateProduct(product, deltaTime, grid);
      if (result === "done" || result === "rejected") {
        toRemove.push(product);
      }
    }

    for (const p of toRemove) {
      this.removeProduct(p);
      for (const [, ms] of this.machineStates) {
        ms.buffer = ms.buffer.filter((b) => b !== p);
        if (ms.processing === p) ms.processing = null;
      }
    }

    return {
      products: this.toPublicProducts(),
      bottlenecks: this.detectBottlenecks(grid),
      deliveredThisFrame: this._deliveredThisFrame,
      rejectedThisFrame: this._rejectedThisFrame,
      totalProduced: this._totalProduced,
      totalDelivered: this._totalDelivered,
      consecutiveNoRejects: this._consecutiveNoRejects,
    };
  }

  getState() {
    return {
      totalProduced: this._totalProduced,
      totalDelivered: this._totalDelivered,
      totalUpgrades: 0,
      totalDelivered_count: this._totalDelivered,
      totalOrdersCompleted: 0,
      consecutiveNoRejects: this._consecutiveNoRejects,
      products: this.toPublicProducts(),
    };
  }

  private spawnProducts(dt: number) {
    if (!this.level) return;
    this.spawnTimer += dt;
    while (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer -= SPAWN_INTERVAL;
      this.spawnProduct();
    }
  }

  private spawnProduct() {
    if (!this.level) return;
    const entry = this.level.entryPoint;
    const product: InternalProduct = {
      id: `p_${this.productIdCounter++}`,
      stage: 0,
      quality: 1.0,
      posX: entry.x,
      posY: entry.y,
      cellX: entry.x,
      cellY: entry.y,
      state: "moving",
      progress: 1.0,
      timer: 0,
      color: STAGE_COLORS[0],
      waitTimer: 0,
    };
    this.products.push(product);
    this._totalProduced++;
  }

  private updateProduct(product: InternalProduct, dt: number, grid: GridCell[][]): "active" | "done" | "rejected" {
    switch (product.state) {
      case "moving":
        return this.updateMoving(product, dt, grid);
      case "exiting":
        return this.updateExiting(product, dt, grid);
      case "done":
        this._deliveredThisFrame++;
        this._totalDelivered++;
        return "done";
      case "rejected":
        this._rejectedThisFrame++;
        return "rejected";
      case "buffered":
      case "processing":
      case "qa_check":
        return "active";
      default:
        return "active";
    }
  }

  private updateMoving(product: InternalProduct, dt: number, grid: GridCell[][]): "active" | "done" | "rejected" {
    const cell = grid[product.cellY]?.[product.cellX];
    if (!cell) return "active";

    if (cell.type === "exit") {
      product.state = "done";
      return "active";
    }

    if (cell.type === "entry") {
      if (product.progress >= 1.0) {
        const dir = this.level!.entryDirection;
        return this.tryAdvance(product, dir, grid);
      }
      return "active";
    }

    if (cell.type === "conveyor" && cell.conveyor) {
      const speed = cell.conveyor.speed;
      product.progress += dt * speed;

      const dir = cell.conveyor.direction;
      const offset = dirToOffset(dir);
      product.posX = product.cellX + offset.x * Math.min(product.progress, 1.0);
      product.posY = product.cellY + offset.y * Math.min(product.progress, 1.0);

      if (product.progress >= 1.0) {
        product.progress = 1.0;
        return this.tryAdvance(product, dir, grid);
      }
      return "active";
    }

    if (cell.type === "machine" || cell.type === "qa_station") {
      const key = getMachineKey(product.cellX, product.cellY);
      const ms = this.machineStates.get(key);
      if (!ms) return "active";

      if (product === ms.processing) {
        return "active";
      }
    }

    return "active";
  }

  private updateExiting(product: InternalProduct, dt: number, grid: GridCell[][]): "active" | "done" | "rejected" {
    product.waitTimer += dt;
    if (product.waitTimer > 0.1) {
      product.waitTimer = 0;
      const cell = grid[product.cellY]?.[product.cellX];
      if (!cell || !cell.machine) return "active";
      return this.tryAdvance(product, cell.machine.direction, grid);
    }
    return "active";
  }

  private tryAdvance(product: InternalProduct, direction: Direction, grid: GridCell[][]): "active" | "done" | "rejected" {
    const offset = dirToOffset(direction);
    const targetX = product.cellX + offset.x;
    const targetY = product.cellY + offset.y;

    if (!isInBounds(targetX, targetY, grid)) {
      product.waitTimer += 0.5;
      return "active";
    }

    const targetCell = grid[targetY][targetX];

    if (targetCell.type === "empty") {
      product.waitTimer += 0.5;
      return "active";
    }

    if (targetCell.type === "exit") {
      product.cellX = targetX;
      product.cellY = targetY;
      product.posX = targetX;
      product.posY = targetY;
      product.state = "done";
      return "active";
    }

    if (targetCell.type === "conveyor") {
      product.cellX = targetX;
      product.cellY = targetY;
      product.posX = targetX;
      product.posY = targetY;
      product.progress = 0;
      product.state = "moving";
      return "active";
    }

    if (targetCell.type === "machine" || targetCell.type === "qa_station") {
      const key = getMachineKey(targetX, targetY);
      const ms = this.machineStates.get(key);
      if (!ms) return "active";

      if (ms.buffer.length < ms.maxBuffer) {
        product.cellX = targetX;
        product.cellY = targetY;
        product.posX = targetX;
        product.posY = targetY;
        product.progress = 0;
        product.state = "buffered";
        ms.buffer.push(product);
        return "active";
      }

      product.waitTimer += 0.5;
      return "active";
    }

    return "active";
  }

  private updateMachineProcessing(dt: number, grid: GridCell[][]) {
    for (const [key, ms] of this.machineStates) {
      if (!ms.processing && ms.buffer.length > 0) {
        const next = ms.buffer.shift()!;
        ms.processing = next;
        next.state = ms.machineType === "qa_station" ? "qa_check" : "processing";
        next.timer = ms.processingTime;
        ms.timer = ms.processingTime;
      }

      if (ms.processing) {
        ms.timer -= dt;
        ms.processing.timer -= dt;

        const progressRatio = 1 - Math.max(0, ms.timer) / ms.processingTime;
        ms.processing.progress = progressRatio;

        if (ms.timer <= 0) {
          const product = ms.processing;
          ms.processing = null;

          if (ms.machineType === "qa_station") {
            if (product.quality < QA_QUALITY_THRESHOLD) {
              product.state = "rejected";
              this._consecutiveNoRejects = 0;
            } else {
              this._consecutiveNoRejects++;
              product.stage++;
              product.color = STAGE_COLORS[Math.min(product.stage, STAGE_COLORS.length - 1)];
              product.state = "exiting";
              product.waitTimer = 0;
            }
          } else {
            product.stage++;
            const machineType = MACHINE_TYPES[ms.machineType];
            const qualityFactor = machineType
              ? Math.min(1, machineType.baseQuality + (ms.level - 1) * 0.02)
              : 0.9;
            product.quality *= qualityFactor;
            product.color = STAGE_COLORS[Math.min(product.stage, STAGE_COLORS.length - 1)];
            product.state = "exiting";
            product.waitTimer = 0;
          }
        }
      }
    }
  }

  private detectBottlenecks(grid: GridCell[][]): BottleneckInfo[] {
    const bottlenecks: BottleneckInfo[] = [];
    for (const [key, ms] of this.machineStates) {
      if (ms.buffer.length >= ms.maxBuffer) {
        const [xStr, yStr] = key.split(",");
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        const cell = grid[y]?.[x];
        if (cell && (cell.type === "machine" || cell.type === "qa_station")) {
          bottlenecks.push({
            x,
            y,
            queueSize: ms.buffer.length,
          });
        }
      }
    }
    return bottlenecks;
  }

  private toPublicProducts(): Product[] {
    return this.products.map((p) => ({
      id: p.id,
      stage: p.stage,
      quality: p.quality,
      position: { x: p.posX, y: p.posY },
      currentCell: { x: p.cellX, y: p.cellY },
      state: p.state,
      progress: p.progress,
      processingTimer: p.timer,
      color: p.color,
    }));
  }

  private emptyResult(): EngineResult {
    return {
      products: [],
      bottlenecks: [],
      deliveredThisFrame: 0,
      rejectedThisFrame: 0,
      totalProduced: 0,
      totalDelivered: 0,
      consecutiveNoRejects: 0,
    };
  }

  calculateBottlenecks(): Position[] {
    const positions: Position[] = [];
    for (const [key, ms] of this.machineStates) {
      if (ms.buffer.length >= ms.maxBuffer) {
        const [xStr, yStr] = key.split(",");
        positions.push({ x: parseInt(xStr, 10), y: parseInt(yStr, 10) });
      }
    }
    return positions;
  }

  getProducts(): Product[] {
    return this.toPublicProducts();
  }
}
