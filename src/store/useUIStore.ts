import { create } from 'zustand';

interface UIState {
  showSignalPanel: boolean;
  showReplayPanel: boolean;
  showSaveSlots: boolean;
  showCongestionDash: boolean;
  showLevelComplete: boolean;
  cameraMode: 'orbit' | 'topdown';
  sidebarCollapsed: boolean;

  toggleSignalPanel: () => void;
  toggleReplayPanel: () => void;
  toggleSaveSlots: () => void;
  toggleCongestionDash: () => void;
  setShowLevelComplete: (show: boolean) => void;
  setCameraMode: (mode: 'orbit' | 'topdown') => void;
  toggleSidebar: () => void;
  resetUI: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  showSignalPanel: true,
  showReplayPanel: false,
  showSaveSlots: false,
  showCongestionDash: true,
  showLevelComplete: false,
  cameraMode: 'orbit',
  sidebarCollapsed: false,

  toggleSignalPanel: () => set((s) => ({ showSignalPanel: !s.showSignalPanel })),
  toggleReplayPanel: () => set((s) => ({ showReplayPanel: !s.showReplayPanel })),
  toggleSaveSlots: () => set((s) => ({ showSaveSlots: !s.showSaveSlots })),
  toggleCongestionDash: () => set((s) => ({ showCongestionDash: !s.showCongestionDash })),
  setShowLevelComplete: (show) => set({ showLevelComplete: show }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  resetUI: () =>
    set({
      showSignalPanel: true,
      showReplayPanel: false,
      showSaveSlots: false,
      showCongestionDash: true,
      showLevelComplete: false,
      cameraMode: 'orbit',
      sidebarCollapsed: false,
    }),
}));
