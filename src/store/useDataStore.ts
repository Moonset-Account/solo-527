import { create } from 'zustand'
import type { 
  DailySalesData, KPIData, TimeSeriesPoint, StorePerformance, 
  WeatherImpact, HourlySalesData, AnomalyPoint, CampaignComparison
} from '@/types/data'
import { generateAllData } from '@/data/mock/generator'
import { 
  filterData, aggregateByTimeWindow, aggregateByStore, 
  aggregateByWeather, aggregateHourlyHeatmap, calculateKPIs, 
  detectAnomalies, getCampaignComparison 
} from '@/data/etl/aggregator'
import { dataCache } from '@/data/cache/dataCache'
import { useFilterStore } from './useFilterStore'
import { addDays } from '@/data/mock/seedData'

interface DrillDownContext {
  type: 'store' | 'date' | 'weather' | 'campaign' | null
  value: string | null
  title: string
}

interface DataStore {
  rawData: DailySalesData[]
  isLoading: boolean
  isEmpty: boolean
  error: string | null
  
  filteredData: DailySalesData[]
  kpiData: KPIData | null
  timeSeriesData: TimeSeriesPoint[]
  storePerformance: StorePerformance[]
  weatherImpact: WeatherImpact[]
  hourlyHeatmap: HourlySalesData[]
  anomalies: AnomalyPoint[]
  campaignComparison: CampaignComparison[]
  
  drillDownContext: DrillDownContext
  selectedStoreId: string | null
  
  loadData: () => void
  refreshData: () => void
  setDrillDown: (context: DrillDownContext) => void
  clearDrillDown: () => void
  setSelectedStore: (storeId: string | null) => void
  
  getDetailData: () => DailySalesData[]
  computeDerivedData: () => void
}

export const useDataStore = create<DataStore>((set, get) => ({
  rawData: [],
  isLoading: false,
  isEmpty: false,
  error: null,
  
  filteredData: [],
  kpiData: null,
  timeSeriesData: [],
  storePerformance: [],
  weatherImpact: [],
  hourlyHeatmap: [],
  anomalies: [],
  campaignComparison: [],
  
  drillDownContext: { type: null, value: null, title: '' },
  selectedStoreId: null,
  
  loadData: () => {
    set({ isLoading: true, error: null })
    
    try {
      const cacheKey = 'rawData'
      let rawData = dataCache.get(cacheKey) as DailySalesData[] | undefined
      
      if (!rawData) {
        rawData = generateAllData()
        dataCache.set(cacheKey, rawData)
      }
      
      set({ rawData, isLoading: false })
      get().computeDerivedData()
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },
  
  refreshData: () => {
    dataCache.clear()
    get().loadData()
  },
  
  setDrillDown: (context) => set({ drillDownContext: context }),
  clearDrillDown: () => set({ drillDownContext: { type: null, value: null, title: '' } }),
  setSelectedStore: (storeId) => set({ selectedStoreId: storeId }),
  
  getDetailData: () => {
    const { filteredData, drillDownContext } = get()
    if (!drillDownContext.type || !drillDownContext.value) {
      return filteredData
    }
    
    switch (drillDownContext.type) {
      case 'store':
        return filteredData.filter(d => d.storeId === drillDownContext.value)
      case 'date':
        return filteredData.filter(d => d.date === drillDownContext.value)
      case 'weather':
        return filteredData.filter(d => d.weatherType === drillDownContext.value)
      default:
        return filteredData
    }
  },
  
  computeDerivedData: () => {
    const { rawData } = get()
    const filters = useFilterStore.getState()
    
    if (rawData.length === 0) {
      set({ isEmpty: true })
      return
    }
    
    const cacheKey = JSON.stringify({
      storeIds: filters.storeIds,
      timeRange: filters.timeRange,
      weatherTypes: filters.weatherTypes,
      campaignId: filters.campaignId,
      timeWindow: filters.timeWindow,
    })
    
    let computed = dataCache.get(cacheKey) as any
    
    if (!computed) {
      const filtered = filterData(rawData, filters)
      
      const prevStart = addDays(filters.timeRange.start, 
        -(new Date(filters.timeRange.end).getTime() - new Date(filters.timeRange.start).getTime()) / (1000 * 60 * 60 * 24) - 1
      )
      const prevEnd = addDays(filters.timeRange.start, -1)
      const prevFiltered = filterData(rawData, { ...filters, timeRange: { start: prevStart, end: prevEnd } })
      
      computed = {
        filteredData: filtered,
        kpiData: calculateKPIs(filtered, prevFiltered),
        timeSeriesData: aggregateByTimeWindow(filtered, filters.timeWindow),
        storePerformance: aggregateByStore(filtered),
        weatherImpact: aggregateByWeather(filtered),
        hourlyHeatmap: aggregateHourlyHeatmap(filtered),
        anomalies: detectAnomalies(filtered),
        campaignComparison: filters.campaignId ? getCampaignComparison(rawData, filters.campaignId) : [],
      }
      
      dataCache.set(cacheKey, computed)
    }
    
    set({
      filteredData: computed.filteredData,
      kpiData: computed.kpiData,
      timeSeriesData: computed.timeSeriesData,
      storePerformance: computed.storePerformance,
      weatherImpact: computed.weatherImpact,
      hourlyHeatmap: computed.hourlyHeatmap,
      anomalies: computed.anomalies,
      campaignComparison: computed.campaignComparison,
      isEmpty: computed.filteredData.length === 0,
    })
  },
}))
