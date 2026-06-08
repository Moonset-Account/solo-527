import { create } from 'zustand';

interface UIStoreState {
  showDebugPanel: boolean;
  showTutorial: boolean;
  tutorialStep: number;
  panelCollapsed: boolean;
}

interface UIStoreActions {
  toggleDebugPanel: () => void;
  setShowDebugPanel: (show: boolean) => void;
  toggleTutorial: () => void;
  setShowTutorial: (show: boolean) => void;
  setTutorialStep: (step: number) => void;
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  togglePanelCollapsed: () => void;
  setPanelCollapsed: (collapsed: boolean) => void;
  resetUI: () => void;
}

export type UIStore = UIStoreState & UIStoreActions;

const initialState: UIStoreState = {
  showDebugPanel: false,
  showTutorial: false,
  tutorialStep: 0,
  panelCollapsed: false,
};

export const useUIStore = create<UIStore>((set, get) => ({
  ...initialState,

  toggleDebugPanel: () => {
    set((state) => ({ showDebugPanel: !state.showDebugPanel }));
  },

  setShowDebugPanel: (show: boolean) => {
    set({ showDebugPanel: show });
  },

  toggleTutorial: () => {
    set((state) => ({ showTutorial: !state.showTutorial }));
  },

  setShowTutorial: (show: boolean) => {
    set({ showTutorial: show });
  },

  setTutorialStep: (step: number) => {
    set({ tutorialStep: Math.max(0, step) });
  },

  nextTutorialStep: () => {
    set((state) => ({ tutorialStep: state.tutorialStep + 1 }));
  },

  prevTutorialStep: () => {
    const { tutorialStep } = get();
    if (tutorialStep > 0) {
      set({ tutorialStep: tutorialStep - 1 });
    }
  },

  togglePanelCollapsed: () => {
    set((state) => ({ panelCollapsed: !state.panelCollapsed }));
  },

  setPanelCollapsed: (collapsed: boolean) => {
    set({ panelCollapsed: collapsed });
  },

  resetUI: () => {
    set(initialState);
  },
}));
