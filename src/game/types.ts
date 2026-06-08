export type CellType = "empty" | "machine" | "conveyor" | "qa_station" | "entry" | "exit";

export type Direction = "up" | "down" | "left" | "right";

export type ProductState = "moving" | "buffered" | "processing" | "qa_check" | "exiting" | "done" | "rejected";

export type Position = { x: number; y: number };

export interface Product {
  id: string;
  stage: number;
  quality: number;
  position: Position;
  currentCell: Position;
  state: ProductState;
  progress: number;
  processingTimer: number;
  color: string;
}

export interface MachineType {
  id: string;
  name: string;
  baseSpeed: number;
  baseQuality: number;
  upgradeCostMultiplier: number;
  maxLevel: number;
  cost: number;
  sprite: string;
  bufferCapacity: number;
}

export interface MachineInstance {
  type: string;
  gridX: number;
  gridY: number;
  level: number;
  direction: Direction;
  buffer: Product[];
  processingProduct: Product | null;
  processingTimer: number;
}

export interface ConveyorSegment {
  gridX: number;
  gridY: number;
  direction: Direction;
  speed: number;
  products: Product[];
}

export type OrderDifficulty = "easy" | "normal" | "hard" | "elite";

export interface OrderTemplate {
  id: string;
  name: string;
  difficulty: OrderDifficulty;
  requiredCount: number;
  timeLimit: number;
  coinReward: number;
  expReward: number;
  requiredStages: number;
}

export interface ActiveOrder {
  id: string;
  templateId: string;
  required: number;
  delivered: number;
  timeRemaining: number;
  completed: boolean;
}

export interface LevelConfig {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  startCoins: number;
  availableMachines: string[];
  orderPool: string[];
  starThresholds: { 1: number; 2: number; 3: number };
  entryPoint: Position;
  exitPoint: Position;
  entryDirection: Direction;
  description: string;
}

export type AchievementCategory = "production" | "order" | "upgrade" | "special";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  target: number;
  icon: string;
}

export interface AchievementProgress {
  id: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  machine: MachineInstance | null;
  conveyor: ConveyorSegment | null;
}

export interface GameState {
  grid: GridCell[][];
  products: Product[];
  orders: ActiveOrder[];
  coins: number;
  exp: number;
  level: string;
  running: boolean;
  totalProduced: number;
  totalDelivered: number;
  totalOrdersCompleted: number;
  totalUpgrades: number;
  consecutiveNoRejects: number;
  offlineCollections: number;
  eliteOrdersCompleted: number;
  spawnTimer: number;
  spawnInterval: number;
  achievements: AchievementProgress[];
}

export interface SaveData {
  version: number;
  timestamp: number;
  data: GameState;
}

export interface BottleneckInfo {
  x: number;
  y: number;
  queueSize: number;
}

export interface GlobalStats {
  totalDeliveries: number;
  totalCoinsEarned: number;
  totalPlayTime: number;
  bottleneckCount: number;
  totalProductsMade: number;
  totalUpgrades: number;
  ordersByDifficulty: Record<OrderDifficulty, number>;
}

export interface OfflineReward {
  coins: number;
  products: number;
  duration: number;
}

export interface EngineResult {
  products: Product[];
  bottlenecks: BottleneckInfo[];
  deliveredThisFrame: number;
  rejectedThisFrame: number;
  totalProduced: number;
  totalDelivered: number;
  consecutiveNoRejects: number;
}

export interface LevelCompleteInfo {
  levelId: string;
  stars: number;
  timeTaken: number;
  ordersCompleted: number;
  coinReward: number;
  expReward: number;
}
