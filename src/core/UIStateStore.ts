import { create } from 'zustand';
import type {
  ComponentInstance,
  WireInstance,
  ComponentType,
  Vec2,
  SimulationResult,
  CircuitData,
  SwitchProps,
} from '@/game/types';

export type SceneId = 'menu' | 'level-select' | 'sandbox' | 'tutorial';

interface GameState {
  scene: SceneId;
  currentLevelId: string | null;
  setScene: (scene: SceneId) => void;
  setCurrentLevel: (id: string | null) => void;
  resetToMenu: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  scene: 'menu',
  currentLevelId: null,
  setScene: (scene) => set({ scene }),
  setCurrentLevel: (id) => set({ currentLevelId: id }),
  resetToMenu: () => set({ scene: 'menu', currentLevelId: null }),
}));

type ObjectivesStatus = {
  completed: string[];
  failed: string[];
  progress: Record<string, number>;
} | null;

interface SandboxState {
  components: ComponentInstance[];
  wires: WireInstance[];
  selectedComponentId: string | null;
  selectedWireId: string | null;
  draggingComponentType: ComponentType | null;
  draggingPosition: Vec2 | null;
  wiringFromPortId: string | null;
  hoveredPortId: string | null;
  simulationResult: SimulationResult | null;
  objectivesStatus: ObjectivesStatus;
  canvasOffset: Vec2;
  canvasScale: number;
  addComponent: (component: ComponentInstance) => void;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, pos: Vec2) => void;
  selectComponent: (id: string | null) => void;
  clearAll: () => void;
  addWire: (wire: WireInstance) => void;
  removeWire: (id: string) => void;
  setWiring: (portId: string | null) => void;
  setHoveredPort: (portId: string | null) => void;
  setDragging: (type: ComponentType | null, pos: Vec2 | null) => void;
  setSimulation: (result: SimulationResult | null) => void;
  setObjectivesStatus: (status: ObjectivesStatus) => void;
  setCanvasTransform: (offset: Vec2, scale: number) => void;
  loadCircuit: (circuitData: CircuitData) => void;
  toggleSwitch: (componentId: string) => void;
}

export const useSandboxStore = create<SandboxState>((set, get) => ({
  components: [],
  wires: [],
  selectedComponentId: null,
  selectedWireId: null,
  draggingComponentType: null,
  draggingPosition: null,
  wiringFromPortId: null,
  hoveredPortId: null,
  simulationResult: null,
  objectivesStatus: null,
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,

  addComponent: (component) =>
    set((state) => ({
      components: [...state.components, component],
    })),

  removeComponent: (id) => {
    set((state) => {
      const component = state.components.find((c) => c.id === id);
      const portIds = component ? component.ports.map((p) => p.id) : [];
      return {
        components: state.components.filter((c) => c.id !== id),
        wires: state.wires.filter(
          (w) => !portIds.includes(w.fromPortId) && !portIds.includes(w.toPortId)
        ),
        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
      };
    });
  },

  moveComponent: (id, pos) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, position: pos } : c
      ),
    })),

  selectComponent: (id) =>
    set({
      selectedComponentId: id,
      selectedWireId: id !== null ? null : get().selectedWireId,
    }),

  clearAll: () =>
    set({
      components: [],
      wires: [],
      selectedComponentId: null,
      selectedWireId: null,
      wiringFromPortId: null,
      hoveredPortId: null,
      simulationResult: null,
      objectivesStatus: null,
    }),

  addWire: (wire) =>
    set((state) => ({
      wires: [...state.wires, wire],
    })),

  removeWire: (id) =>
    set((state) => ({
      wires: state.wires.filter((w) => w.id !== id),
      selectedWireId: state.selectedWireId === id ? null : state.selectedWireId,
    })),

  setWiring: (portId) => set({ wiringFromPortId: portId }),

  setHoveredPort: (portId) => set({ hoveredPortId: portId }),

  setDragging: (type, pos) =>
    set({
      draggingComponentType: type,
      draggingPosition: pos,
    }),

  setSimulation: (result) => set({ simulationResult: result }),

  setObjectivesStatus: (status) => set({ objectivesStatus: status }),

  setCanvasTransform: (offset, scale) =>
    set({
      canvasOffset: offset,
      canvasScale: scale,
    }),

  loadCircuit: (circuitData) =>
    set({
      components: [...circuitData.components],
      wires: [...circuitData.wires],
      selectedComponentId: null,
      selectedWireId: null,
      simulationResult: null,
      objectivesStatus: null,
    }),

  toggleSwitch: (componentId) =>
    set((state) => ({
      components: state.components.map((c) => {
        if (c.id !== componentId || c.type !== 'switch') return c;
        const props = c.properties as SwitchProps;
        return {
          ...c,
          properties: {
            ...props,
            closed: !props.closed,
          } as SwitchProps,
        };
      }),
    })),
}));

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
  createdAt: number;
}

interface UINotificationState {
  notifications: Notification[];
  pushNotification: (
    message: string,
    type?: NotificationType,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
}

function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useUINotificationStore = create<UINotificationState>((set, get) => ({
  notifications: [],

  pushNotification: (message, type = 'info', duration = 3000) => {
    const id = generateNotificationId();
    const createdAt = Date.now();
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id, type, message, duration, createdAt },
      ],
    }));
    if (duration > 0) {
      setTimeout(() => {
        const exists = get().notifications.some((n) => n.id === id);
        if (exists) {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        }
      }, duration);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

interface SettingsDialogState {
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useSettingsDialogStore = create<SettingsDialogState>((set) => ({
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
