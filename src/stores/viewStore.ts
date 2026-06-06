import { create } from 'zustand';
import { SavedView, FilterState } from '../data/types';

const STORAGE_KEY = 'dashboard:savedViews';

const loadViewsFromStorage = (): SavedView[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

interface ViewStore {
  views: SavedView[];
  selectedViewId: string | null;
  saveView: (name: string, filters: FilterState) => void;
  deleteView: (id: string) => void;
  renameView: (id: string, name: string) => void;
  selectView: (id: string | null) => void;
  getViewById: (id: string) => SavedView | undefined;
}

export const useViewStore = create<ViewStore>((set, get) => ({
  views: loadViewsFromStorage(),
  selectedViewId: null,
  
  saveView: (name, filters) => set((state) => {
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name,
      filters,
      createdAt: new Date().toISOString(),
    };
    const views = [...state.views, newView];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    return { views, selectedViewId: newView.id };
  }),
  
  deleteView: (id) => set((state) => {
    const views = state.views.filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    return {
      views,
      selectedViewId: state.selectedViewId === id ? null : state.selectedViewId,
    };
  }),
  
  renameView: (id, name) => set((state) => {
    const views = state.views.map((v) => 
      v.id === id ? { ...v, name } : v
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    return { views };
  }),
  
  selectView: (id) => set({ selectedViewId: id }),
  
  getViewById: (id) => {
    return get().views.find((v) => v.id === id);
  },
}));
