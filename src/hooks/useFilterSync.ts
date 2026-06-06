import { useEffect, useRef } from 'react'
import { useFilterStore } from '@/store/useFilterStore'
import { useDataStore } from '@/store/useDataStore'
import { useViewStore } from '@/store/useViewStore'

export function useFilterSync() {
  const computeDerivedData = useDataStore(state => state.computeDerivedData)
  const rawDataLength = useDataStore(state => state.rawData.length)
  
  const filters = useFilterStore(state => ({
    storeIds: state.storeIds,
    categories: state.categories,
    timeRange: state.timeRange,
    timeWindow: state.timeWindow,
    weatherTypes: state.weatherTypes,
    campaignId: state.campaignId,
    compareWithCampaign: state.compareWithCampaign,
  }))
  
  const prevFilters = useRef(filters)
  
  useEffect(() => {
    const hasChanged = JSON.stringify(prevFilters.current) !== JSON.stringify(filters)
    if (hasChanged && rawDataLength > 0) {
      prevFilters.current = filters
      computeDerivedData()
    }
  }, [filters, computeDerivedData, rawDataLength])
}

export function useInitializeData() {
  const loadData = useDataStore(state => state.loadData)
  const loadViews = useViewStore(state => state.loadViews)
  
  useEffect(() => {
    loadData()
    loadViews()
  }, [loadData, loadViews])
}
