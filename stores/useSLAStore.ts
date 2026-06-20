import { create } from 'zustand';
import type { SLARule, SLARuleVersion } from '@prisma/client';

interface SLAStore {
  rules: (SLARule & { versions?: SLARuleVersion[] })[];
  currentRule: SLARule | null;
  loading: boolean;
  error: string | null;
  filters: {
    category: string;
    status: string;
  };
  setFilters: (filters: Partial<{ category: string; status: string }>) => void;
  setRules: (rules: SLARule[]) => void;
  setCurrentRule: (rule: SLARule | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSLAStore = create<SLAStore>((set) => ({
  rules: [],
  currentRule: null,
  loading: false,
  error: null,
  filters: {
    category: '',
    status: '',
  },
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setRules: (rules) => set({ rules }),
  setCurrentRule: (rule) => set({ currentRule: rule }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
