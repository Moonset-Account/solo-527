import { create } from 'zustand';
import { FilterState } from '@/types';

interface FilterStore {
  filters: FilterState;
  setMemberTypes: (ids: number[]) => void;
  setStores: (ids: number[]) => void;
  setCoaches: (ids: number[]) => void;
  setCourses: (ids: number[]) => void;
  setMonth: (month: string | undefined) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  memberTypeIds: [],
  storeIds: [],
  coachIds: [],
  courseIds: [],
  month: undefined,
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: initialFilters,
  setMemberTypes: (ids) => set((state) => ({ 
    filters: { ...state.filters, memberTypeIds: ids } 
  })),
  setStores: (ids) => set((state) => ({ 
    filters: { ...state.filters, storeIds: ids } 
  })),
  setCoaches: (ids) => set((state) => ({ 
    filters: { ...state.filters, coachIds: ids } 
  })),
  setCourses: (ids) => set((state) => ({ 
    filters: { ...state.filters, courseIds: ids } 
  })),
  setMonth: (month) => set((state) => ({ 
    filters: { ...state.filters, month } 
  })),
  resetFilters: () => set({ filters: initialFilters }),
}));
