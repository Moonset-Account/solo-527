import { create } from 'zustand'

interface FilterState {
  productIds: string[]
  shopIds: string[]
  reasonIds: string[]
  warehouseIds: string[]
  logisticsIds: string[]
  dateRange: [string, string]
  dataUpdateTime: string
  sampleSize: number
  currentUser: { role: string; name: string }
  setFilter: (key: string, value: unknown) => void
  resetFilter: () => void
  getFilterSnapshot: () => Record<string, unknown>
}

const initialState = {
  productIds: [] as string[],
  shopIds: [] as string[],
  reasonIds: [] as string[],
  warehouseIds: [] as string[],
  logisticsIds: [] as string[],
  dateRange: ['', ''] as [string, string],
  dataUpdateTime: new Date().toISOString(),
  sampleSize: 0,
  currentUser: { role: 'analyst', name: '分析师' },
}

export const useFilterStore = create<FilterState>((set, get) => ({
  ...initialState,
  setFilter: (key, value) => set({ [key]: value }),
  resetFilter: () =>
    set({
      productIds: [],
      shopIds: [],
      reasonIds: [],
      warehouseIds: [],
      logisticsIds: [],
      dateRange: ['', ''],
    }),
  getFilterSnapshot: () => {
    const state = get()
    return {
      productIds: state.productIds,
      shopIds: state.shopIds,
      reasonIds: state.reasonIds,
      warehouseIds: state.warehouseIds,
      logisticsIds: state.logisticsIds,
      dateRange: state.dateRange,
      sampleSize: state.sampleSize,
    }
  },
}))
