import { create } from "zustand";

type UIState = {
  orderPanelOpen: boolean;
  bgmVolume: number;
  sfxVolume: number;
  autoSave: boolean;
  offlineEarnings: boolean;
};

type UIActions = {
  toggleOrderPanel: () => void;
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleAutoSave: () => void;
  toggleOfflineEarnings: () => void;
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  orderPanelOpen: true,
  bgmVolume: 50,
  sfxVolume: 70,
  autoSave: true,
  offlineEarnings: true,

  toggleOrderPanel: () => set((s) => ({ orderPanelOpen: !s.orderPanelOpen })),
  setBgmVolume: (v) => set({ bgmVolume: v }),
  setSfxVolume: (v) => set({ sfxVolume: v }),
  toggleAutoSave: () => set((s) => {
    const next = !s.autoSave;
    if (next) localStorage.setItem("retro_factory_autoSave", "true");
    else localStorage.setItem("retro_factory_autoSave", "false");
    return { autoSave: next };
  }),
  toggleOfflineEarnings: () => set((s) => {
    const next = !s.offlineEarnings;
    if (next) localStorage.setItem("retro_factory_offline", "true");
    else localStorage.setItem("retro_factory_offline", "false");
    return { offlineEarnings: next };
  }),
}));
