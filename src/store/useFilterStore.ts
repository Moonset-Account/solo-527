import { create } from 'zustand'
import type { FilterState, TimeWindow, WeatherType } from '@/types/data'

interface FilterStore extends FilterState {
  setStoreIds: (storeIds: string[]) => void
  setCategories: (categories: string[]) => void
  setTimeRange: (start: string, end: string) => void
  setTimeWindow: (window: TimeWindow) => void
  setWeatherTypes: (types: WeatherType[]) => void
  setCampaignId: (id: string | null) => void
  setCompareWithCampaign: (compare: boolean) => void
  resetFilters: () => void
  setFilters: (filters: Partial<FilterState>) => void
}

const defaultFilters: FilterState = {
  storeIds: [],
  categories: [],
  timeRange: { start: '2025-06-01', end: '2025-07-15' },
  timeWindow: 'day',
  weatherTypes: [],
  campaignId: null,
  compareWithCampaign: false,
}

export const useFilterStore = create<FilterStore>((set) => ({
  ...defaultFilters,
  
  setStoreIds: (storeIds) => set({ storeIds }),
  setCategories: (categories) => set({ categories }),
  setTimeRange: (start, end) => set({ timeRange: { start, end } }),
  setTimeWindow: (timeWindow) => set({ timeWindow }),
  setWeatherTypes: (weatherTypes) => set({ weatherTypes }),
  setCampaignId: (campaignId) => set({ campaignId }),
  setCompareWithCampaign: (compareWithCampaign) => set({ compareWithCampaign }),
  
  resetFilters: () => set(defaultFilters),
  
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
}))
