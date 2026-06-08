import { create } from "zustand";
import type {
  Direction,
  MachineInstance,
  ActiveOrder,
  GridCell,
  BottleneckInfo,
  OfflineReward,
  AchievementDef,
  GlobalStats,
  LevelCompleteInfo,
  Position,
} from "@/game/types";
import { LEVEL_CONFIGS } from "@/config/levels";
import { MACHINE_TYPES } from "@/config/machines";
import { ORDER_TEMPLATES } from "@/config/orders";
import { ACHIEVEMENT_DEFS } from "@/config/achievements";
import { createGrid, placeMachine as gridPlaceMachine, placeConveyor, removeMachine as gridRemoveMachine } from "@/game/grid";
import { GameEngine } from "@/game/engine";

type LevelProgress = {
  stars: number;
  unlocked: boolean;
  bestTime: number;
};

type GameState = {
  coins: number;
  exp: number;
  currentLevelId: string | null;
  grid: GridCell[][];
  machines: MachineInstance[];
  activeOrders: ActiveOrder[];
  availableOrders: ActiveOrder[];
  bottlenecks: BottleneckInfo[];
  selectedMachineType: string | null;
  selectedDirection: Direction;
  upgradeTarget: MachineInstance | null;
  offlineReward: OfflineReward | null;
  newAchievements: AchievementDef[];
  isPaused: boolean;
  speed: number;
  completedLevels: Record<string, LevelProgress>;
  stats: GlobalStats;
  lastSaveTime: number;
  hasSave: boolean;
  engine: GameEngine | null;
  levelStartTime: number;
  levelCompleteInfo: LevelCompleteInfo | null;
  deliveredCount: number;
  removeMode: boolean;
};

type GameActions = {
  initLevel: (levelId: string) => void;
  update: (deltaTime: number) => void;
  placeMachine: (x: number, y: number) => void;
  removeMachineAt: (x: number, y: number) => void;
  selectMachineType: (type: string | null) => void;
  setSelectedDirection: (dir: Direction) => void;
  selectMachineForUpgrade: (gridX: number, gridY: number) => void;
  closeUpgradeModal: () => void;
  upgradeMachine: () => void;
  acceptOrder: (orderId: string) => void;
  deliverOrder: (orderId: string) => void;
  claimOfflineReward: () => void;
  dismissAchievement: (id: string) => void;
  togglePause: () => void;
  setSpeed: (speed: number) => void;
  handleCellClick: (x: number, y: number) => void;
  save: () => void;
  load: () => void;
  resetLevel: () => void;
  resetAll: () => void;
  setHasSave: (v: boolean) => void;
  calculateOfflineReward: () => void;
  toggleRemoveMode: () => void;
  dismissLevelComplete: () => void;
};

const defaultStats: GlobalStats = {
  totalDeliveries: 0,
  totalCoinsEarned: 0,
  totalPlayTime: 0,
  bottleneckCount: 0,
  totalProductsMade: 0,
  totalUpgrades: 0,
  ordersByDifficulty: { easy: 0, normal: 0, hard: 0, elite: 0 },
};

function collectMachines(grid: GridCell[][]): MachineInstance[] {
  const machines: MachineInstance[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (cell.machine) {
        machines.push(cell.machine);
      }
    }
  }
  return machines;
}

function generateAvailableOrders(levelId: string): ActiveOrder[] {
  const level = LEVEL_CONFIGS.find((l) => l.id === levelId);
  if (!level) return [];
  return level.orderPool.map((orderId) => {
    const template = ORDER_TEMPLATES.find((t) => t.id === orderId);
    if (!template) return null;
    return {
      id: `active_${orderId}_${Date.now()}`,
      templateId: orderId,
      required: template.requiredCount,
      delivered: 0,
      timeRemaining: template.timeLimit,
      completed: false,
    };
  }).filter(Boolean) as ActiveOrder[];
}

function checkAchievements(
  existingNew: AchievementDef[],
  stats: GlobalStats,
  deliveredCount: number,
  consecutiveNoRejects: number,
  completedLevels: Record<string, LevelProgress>,
): AchievementDef[] {
  const result = [...existingNew];
  const checks: Array<{ id: string; condition: boolean }> = [
    { id: "first_product", condition: stats.totalProductsMade >= 1 },
    { id: "mass_production", condition: stats.totalProductsMade >= 1000 },
    { id: "first_order", condition: stats.totalDeliveries >= 1 },
    { id: "order_master", condition: stats.totalDeliveries >= 50 },
    { id: "elite_handler", condition: stats.ordersByDifficulty.elite >= 5 },
    { id: "first_upgrade", condition: stats.totalUpgrades >= 1 },
    { id: "upgrade_frenzy", condition: stats.totalUpgrades >= 20 },
    { id: "no_rejects", condition: consecutiveNoRejects >= 20 },
    { id: "bottleneck_free", condition: stats.bottleneckCount === 0 && stats.totalDeliveries >= 5 },
    { id: "speed_demon", condition: stats.totalDeliveries >= 5 && stats.totalPlayTime <= 60 },
    { id: "maxed_out", condition: Object.values(completedLevels).some(l => l.stars >= 3) },
    { id: "offline_collector", condition: stats.totalProductsMade >= 100 },
  ];

  for (const check of checks) {
    if (check.condition && !result.find((a) => a.id === check.id)) {
      const def = ACHIEVEMENT_DEFS.find((a) => a.id === check.id);
      if (def) result.push(def);
    }
  }
  return result;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  coins: 0,
  exp: 0,
  currentLevelId: null,
  grid: [],
  machines: [],
  activeOrders: [],
  availableOrders: [],
  bottlenecks: [],
  selectedMachineType: null,
  selectedDirection: "right",
  upgradeTarget: null,
  offlineReward: null,
  newAchievements: [],
  isPaused: false,
  speed: 1,
  completedLevels: { level_01: { stars: 0, unlocked: true, bestTime: 0 } },
  stats: { ...defaultStats },
  lastSaveTime: 0,
  hasSave: false,
  engine: null,
  levelStartTime: 0,
  levelCompleteInfo: null,
  deliveredCount: 0,
  removeMode: false,

  initLevel: (levelId) => {
    const level = LEVEL_CONFIGS.find((l) => l.id === levelId);
    if (!level) return;
    const grid = createGrid(level.gridWidth, level.gridHeight, level.entryPoint, level.exitPoint);
    const availableOrders = generateAvailableOrders(levelId);
    const engine = new GameEngine();
    engine.init(level);
    set({
      currentLevelId: levelId,
      grid,
      machines: [],
      coins: level.startCoins,
      activeOrders: [],
      availableOrders,
      bottlenecks: [],
      selectedMachineType: null,
      upgradeTarget: null,
      isPaused: false,
      speed: 1,
      engine,
      levelStartTime: Date.now(),
      levelCompleteInfo: null,
      deliveredCount: 0,
      removeMode: false,
    });
  },

  update: (deltaTime) => {
    const state = get();
    if (state.isPaused || !state.currentLevelId || !state.engine) return;
    const scaledDt = deltaTime * state.speed;

    const result = state.engine.update(scaledDt, state.grid);

    const activeOrders = state.activeOrders.map((order) => ({
      ...order,
      timeRemaining: Math.max(0, order.timeRemaining - scaledDt),
    }));

    let deliveredThisFrame = result.deliveredThisFrame;
    if (deliveredThisFrame > 0) {
      const updatedOrders = activeOrders.map((order) => {
        if (order.completed) return order;
        const toDeliver = Math.min(deliveredThisFrame, order.required - order.delivered);
        deliveredThisFrame -= toDeliver;
        const newDelivered = order.delivered + toDeliver;
        return {
          ...order,
          delivered: newDelivered,
          completed: newDelivered >= order.required,
        };
      });
      set({ activeOrders: updatedOrders });
    }

    const timedOutOrders = activeOrders.filter((o) => o.timeRemaining <= 0 && !o.completed);
    if (timedOutOrders.length > 0) {
      const remaining = activeOrders.filter((o) => o.timeRemaining > 0 || o.completed);
      set({ activeOrders: remaining });
    }

    const newDeliveredCount = state.deliveredCount + result.deliveredThisFrame;
    const newStats: GlobalStats = {
      ...state.stats,
      totalPlayTime: state.stats.totalPlayTime + deltaTime,
      totalProductsMade: result.totalProduced,
      totalDeliveries: result.totalDelivered,
      bottleneckCount: state.stats.bottleneckCount + result.bottlenecks.length > state.bottlenecks.length ? 1 : 0,
    };

    const newAchievements = checkAchievements(
      state.newAchievements,
      newStats,
      newDeliveredCount,
      result.consecutiveNoRejects,
      state.completedLevels,
    );

    set({
      bottlenecks: result.bottlenecks,
      deliveredCount: newDeliveredCount,
      stats: newStats,
      newAchievements,
    });
  },

  placeMachine: (x, y) => {
    const state = get();
    if (!state.selectedMachineType || !state.currentLevelId || !state.engine) return;
    const machineType = MACHINE_TYPES[state.selectedMachineType];
    if (!machineType) return;
    if (state.coins < machineType.cost) return;
    const level = LEVEL_CONFIGS.find((l) => l.id === state.currentLevelId);
    if (!level) return;
    if (y < 0 || y >= level.gridHeight || x < 0 || x >= level.gridWidth) return;
    const cell = state.grid[y][x];
    if (cell.type !== "empty") return;

    let newGrid: GridCell[][];
    if (state.selectedMachineType === "conveyor") {
      newGrid = placeConveyor(state.grid, x, y, state.selectedDirection);
    } else {
      newGrid = gridPlaceMachine(state.grid, x, y, state.selectedMachineType, state.selectedDirection);
    }
    const machines = collectMachines(newGrid);

    if (state.selectedMachineType !== "conveyor") {
      state.engine.registerMachine(x, y, state.selectedMachineType, 1, state.selectedDirection);
    }

    set({
      grid: newGrid,
      machines,
      coins: state.coins - machineType.cost,
    });
  },

  removeMachineAt: (x, y) => {
    const state = get();
    if (!state.currentLevelId || !state.engine) return;
    const cell = state.grid[y]?.[x];
    if (!cell || cell.type === "empty" || cell.type === "entry" || cell.type === "exit") return;

    if (cell.machine) {
      state.engine.unregisterMachine(x, y);
    }

    const newGrid = gridRemoveMachine(state.grid, x, y);
    const machines = collectMachines(newGrid);
    const machineType = cell.machine ? MACHINE_TYPES[cell.machine.type] : null;
    const conveyorCost = MACHINE_TYPES["conveyor"];
    const refund = machineType
      ? Math.floor(machineType.cost * 0.5)
      : conveyorCost
        ? Math.floor(conveyorCost.cost * 0.5)
        : 0;

    set({
      grid: newGrid,
      machines,
      coins: state.coins + refund,
    });
  },

  selectMachineType: (type) => {
    const state = get();
    set({
      selectedMachineType: type === state.selectedMachineType ? null : type,
      removeMode: false,
    });
  },

  setSelectedDirection: (dir) => set({ selectedDirection: dir }),

  selectMachineForUpgrade: (gridX, gridY) => {
    const state = get();
    const cell = state.grid[gridY]?.[gridX];
    if (cell?.machine) {
      set({ upgradeTarget: cell.machine });
    }
  },

  closeUpgradeModal: () => set({ upgradeTarget: null }),

  upgradeMachine: () => {
    const state = get();
    if (!state.upgradeTarget || !state.engine) return;
    const machineType = MACHINE_TYPES[state.upgradeTarget.type];
    if (!machineType) return;
    if (state.upgradeTarget.level >= machineType.maxLevel) return;
    const cost = Math.floor(machineType.cost * Math.pow(machineType.upgradeCostMultiplier, state.upgradeTarget.level - 1));
    if (state.coins < cost) return;

    const grid = state.grid.map((row) =>
      row.map((c) => {
        if (c.machine && c.machine.gridX === state.upgradeTarget!.gridX && c.machine.gridY === state.upgradeTarget!.gridY) {
          const updatedMachine: MachineInstance = {
            ...c.machine,
            level: c.machine.level + 1,
          };
          return { ...c, machine: updatedMachine };
        }
        return c;
      })
    );
    const machines = collectMachines(grid);
    const updatedTarget = grid[state.upgradeTarget.gridY]?.[state.upgradeTarget.gridX]?.machine ?? null;

    state.engine.updateMachineLevel(state.upgradeTarget.gridX, state.upgradeTarget.gridY, state.upgradeTarget.level + 1);

    const stats = { ...state.stats, totalUpgrades: state.stats.totalUpgrades + 1 };
    const newAchievements = checkAchievements(state.newAchievements, stats, state.deliveredCount, 0, state.completedLevels);

    set({
      grid,
      machines,
      coins: state.coins - cost,
      upgradeTarget: updatedTarget,
      stats,
      newAchievements,
    });
  },

  acceptOrder: (orderId) => {
    const state = get();
    const order = state.availableOrders.find((o) => o.id === orderId);
    if (!order) return;
    set({
      availableOrders: state.availableOrders.filter((o) => o.id !== orderId),
      activeOrders: [...state.activeOrders, order],
    });
  },

  deliverOrder: (orderId) => {
    const state = get();
    const order = state.activeOrders.find((o) => o.id === orderId);
    if (!order || !order.completed) return;
    const template = ORDER_TEMPLATES.find((t) => t.id === order.templateId);
    if (!template) return;
    const stats: GlobalStats = {
      ...state.stats,
      totalDeliveries: state.stats.totalDeliveries + 1,
      totalCoinsEarned: state.stats.totalCoinsEarned + template.coinReward,
      ordersByDifficulty: {
        ...state.stats.ordersByDifficulty,
        [template.difficulty]: (state.stats.ordersByDifficulty[template.difficulty] || 0) + 1,
      },
    };

    const completedLevels = { ...state.completedLevels };
    const level = LEVEL_CONFIGS.find((l) => l.id === state.currentLevelId);
    if (level) {
      const current = completedLevels[level.id] || { stars: 0, unlocked: true, bestTime: 0 };
      const timeTaken = (Date.now() - state.levelStartTime) / 1000;
      let stars = 0;
      if (timeTaken <= level.starThresholds[3]) stars = 3;
      else if (timeTaken <= level.starThresholds[2]) stars = 2;
      else if (timeTaken <= level.starThresholds[1]) stars = 1;

      const bestStars = Math.max(current.stars, stars);
      const bestTime = current.bestTime > 0 ? Math.min(current.bestTime, timeTaken) : timeTaken;
      completedLevels[level.id] = { ...current, stars: bestStars, bestTime };

      const nextLevel = LEVEL_CONFIGS[LEVEL_CONFIGS.indexOf(level) + 1];
      if (nextLevel && !completedLevels[nextLevel.id]) {
        completedLevels[nextLevel.id] = { stars: 0, unlocked: true, bestTime: 0 };
      }

      const allActiveCompleted = state.activeOrders.filter((o) => o.id !== orderId).every((o) => o.completed);

      if (stars > 0 || allActiveCompleted) {
        const levelCompleteInfo: LevelCompleteInfo = {
          levelId: level.id,
          stars: bestStars,
          timeTaken,
          ordersCompleted: stats.totalDeliveries,
          coinReward: template.coinReward,
          expReward: template.expReward,
        };
        set({ levelCompleteInfo });
      }
    }

    const newAchievements = checkAchievements(state.newAchievements, stats, state.deliveredCount, 0, completedLevels);

    set({
      activeOrders: state.activeOrders.filter((o) => o.id !== orderId),
      coins: state.coins + template.coinReward,
      exp: state.exp + template.expReward,
      stats,
      completedLevels,
      newAchievements,
    });
  },

  claimOfflineReward: () => set({ offlineReward: null }),

  dismissAchievement: (id) => set({ newAchievements: get().newAchievements.filter((a) => a.id !== id) }),

  togglePause: () => set({ isPaused: !get().isPaused }),

  setSpeed: (speed) => set({ speed }),

  toggleRemoveMode: () => {
    const state = get();
    set({
      removeMode: !state.removeMode,
      selectedMachineType: null,
    });
  },

  dismissLevelComplete: () => set({ levelCompleteInfo: null }),

  handleCellClick: (x, y) => {
    const state = get();
    if (state.removeMode) {
      state.removeMachineAt(x, y);
      return;
    }
    if (state.selectedMachineType) {
      state.placeMachine(x, y);
      return;
    }
    const cell = state.grid[y]?.[x];
    if (cell?.machine) {
      state.selectMachineForUpgrade(x, y);
    }
  },

  save: () => {
    const state = get();
    const gridSnapshot = state.grid.map((row) =>
      row.map((cell) => ({
        type: cell.type,
        machine: cell.machine
          ? { type: cell.machine.type, gridX: cell.machine.gridX, gridY: cell.machine.gridY, level: cell.machine.level, direction: cell.machine.direction }
          : null,
        conveyor: cell.conveyor ? { direction: cell.conveyor.direction } : null,
      }))
    );
    const activeOrdersSnapshot = state.activeOrders.map((o) => ({
      id: o.id,
      templateId: o.templateId,
      required: o.required,
      delivered: o.delivered,
      timeRemaining: o.timeRemaining,
      completed: o.completed,
    }));
    const saveData = {
      version: 2,
      coins: state.coins,
      exp: state.exp,
      completedLevels: state.completedLevels,
      stats: state.stats,
      lastSaveTime: Date.now(),
      currentLevelId: state.currentLevelId,
      grid: state.currentLevelId ? gridSnapshot : [],
      activeOrders: activeOrdersSnapshot,
      deliveredCount: state.deliveredCount,
      levelStartTime: state.levelStartTime,
      newAchievements: state.newAchievements.map((a) => a.id),
    };
    localStorage.setItem("retro_factory_save", JSON.stringify(saveData));
    set({ lastSaveTime: Date.now(), hasSave: true });
  },

  load: () => {
    const raw = localStorage.getItem("retro_factory_save");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const loadedState: Partial<GameState> = {
        coins: data.coins || 0,
        exp: data.exp || 0,
        completedLevels: data.completedLevels || { level_01: { stars: 0, unlocked: true, bestTime: 0 } },
        stats: data.stats || { ...defaultStats },
        lastSaveTime: data.lastSaveTime || 0,
        hasSave: true,
      };

      if (data.currentLevelId && data.grid && data.grid.length > 0) {
        const level = LEVEL_CONFIGS.find((l) => l.id === data.currentLevelId);
        if (level) {
          const engine = new GameEngine();
          engine.init(level);

          const baseGrid = createGrid(level.gridWidth, level.gridHeight, level.entryPoint, level.exitPoint);
          const grid: GridCell[][] = data.grid.map((row: any[], y: number) =>
            row.map((cell: any, x: number) => {
              if (cell.machine) {
                engine.registerMachine(x, y, cell.machine.type, cell.machine.level, cell.machine.direction);
              }
              const baseCell = baseGrid[y]?.[x] || { type: "empty", x, y, machine: null, conveyor: null };
              return {
                ...baseCell,
                type: cell.type || "empty",
                machine: cell.machine
                  ? { type: cell.machine.type, gridX: cell.machine.gridX, gridY: cell.machine.gridY, level: cell.machine.level, direction: cell.machine.direction, processingProduct: null }
                  : null,
                conveyor: cell.conveyor || null,
              };
            })
          );

          const activeOrders: ActiveOrder[] = (data.activeOrders || []).map((o: any) => ({
            id: o.id,
            templateId: o.templateId,
            required: o.required,
            delivered: o.delivered,
            timeRemaining: o.timeRemaining,
            completed: o.completed,
          }));
          const availableOrders = generateAvailableOrders(data.currentLevelId);

          Object.assign(loadedState, {
            currentLevelId: data.currentLevelId,
            grid,
            machines: collectMachines(grid),
            engine,
            activeOrders,
            availableOrders,
            deliveredCount: data.deliveredCount || 0,
            levelStartTime: data.levelStartTime || Date.now(),
          });
        }
      }

      if (data.newAchievements && Array.isArray(data.newAchievements)) {
        const achIds: string[] = data.newAchievements;
        loadedState.newAchievements = achIds
          .map((id: string) => ACHIEVEMENT_DEFS.find((a) => a.id === id))
          .filter(Boolean) as AchievementDef[];
      }

      set(loadedState as any);
    } catch {
      // ignore
    }
  },

  resetLevel: () => {
    const state = get();
    if (state.currentLevelId) {
      state.initLevel(state.currentLevelId);
    }
  },

  resetAll: () => {
    localStorage.removeItem("retro_factory_save");
    set({
      coins: 0,
      exp: 0,
      currentLevelId: null,
      grid: [],
      machines: [],
      activeOrders: [],
      availableOrders: [],
      bottlenecks: [],
      selectedMachineType: null,
      upgradeTarget: null,
      offlineReward: null,
      newAchievements: [],
      isPaused: false,
      speed: 1,
      completedLevels: { level_01: { stars: 0, unlocked: true, bestTime: 0 } },
      stats: { ...defaultStats },
      lastSaveTime: 0,
      hasSave: false,
      engine: null,
      levelStartTime: 0,
      levelCompleteInfo: null,
      deliveredCount: 0,
      removeMode: false,
    });
  },

  setHasSave: (v) => set({ hasSave: v }),

  calculateOfflineReward: () => {
    const raw = localStorage.getItem("retro_factory_save");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const lastSave = data.lastSaveTime || 0;
      const now = Date.now();
      const diffMs = now - lastSave;
      const diffHours = Math.min(diffMs / (1000 * 60 * 60), 24);
      if (diffHours < 0.01) return;
      const baseRate = 50;
      const levelBonus = Object.values(data.completedLevels || {}).filter((l: any) => l.stars > 0).length * 15;
      const deliveryBonus = (data.stats?.totalDeliveries || 0) * 0.5;
      const hourlyRate = baseRate + levelBonus + deliveryBonus;
      const coins = Math.floor(diffHours * hourlyRate);
      const products = Math.floor(diffHours * (10 + levelBonus * 0.3));
      set({ offlineReward: { coins, products, duration: diffHours } });
    } catch {
      // ignore
    }
  },
}));
