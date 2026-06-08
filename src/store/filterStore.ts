import { create } from 'zustand'

export interface FilterState {
  collectionTypes: string[]
  readerGroups: string[]
  themes: string[]
  branches: string[]
  dateRange: { start: string; end: string }
}

const defaultDateRange = () => {
  return {
    start: '2024-01-01',
    end: '2025-05-31',
  }
}

interface FilterStore {
  filters: FilterState
  setCollectionTypes: (v: string[]) => void
  setReaderGroups: (v: string[]) => void
  setThemes: (v: string[]) => void
  setBranches: (v: string[]) => void
  setDateRange: (v: { start: string; end: string }) => void
  resetFilters: () => void
  setFilters: (f: Partial<FilterState>) => void
}

const defaultFilters: FilterState = {
  collectionTypes: [],
  readerGroups: [],
  themes: [],
  branches: [],
  dateRange: defaultDateRange(),
}

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  setCollectionTypes: (v) => set((s) => ({ filters: { ...s.filters, collectionTypes: v } })),
  setReaderGroups: (v) => set((s) => ({ filters: { ...s.filters, readerGroups: v } })),
  setThemes: (v) => set((s) => ({ filters: { ...s.filters, themes: v } })),
  setBranches: (v) => set((s) => ({ filters: { ...s.filters, branches: v } })),
  setDateRange: (v) => set((s) => ({ filters: { ...s.filters, dateRange: v } })),
  resetFilters: () => set({ filters: { ...defaultFilters, dateRange: defaultDateRange() } }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
}))
