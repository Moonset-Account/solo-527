import { create } from 'zustand'
import type { SavedView, FilterState } from '@/types/data'
import { useFilterStore } from './useFilterStore'

const STORAGE_KEY = 'coffee-dashboard-views'

interface ViewStore {
  savedViews: SavedView[]
  currentViewId: string | null
  
  loadViews: () => void
  saveView: (name: string) => void
  loadView: (viewId: string) => void
  deleteView: (viewId: string) => void
  updateView: (viewId: string, name: string) => void
  getCurrentViewName: () => string | null
}

export const useViewStore = create<ViewStore>((set, get) => ({
  savedViews: [],
  currentViewId: null,
  
  loadViews: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const savedViews = JSON.parse(stored) as SavedView[]
        set({ savedViews })
      }
    } catch (e) {
      console.error('Failed to load views:', e)
    }
  },
  
  saveView: (name: string) => {
    const filters = useFilterStore.getState()
    const id = `view-${Date.now()}`
    
    const filterState: FilterState = {
      storeIds: filters.storeIds,
      categories: filters.categories,
      timeRange: { ...filters.timeRange },
      timeWindow: filters.timeWindow,
      weatherTypes: filters.weatherTypes,
      campaignId: filters.campaignId,
      compareWithCampaign: filters.compareWithCampaign,
    }
    
    const newView: SavedView = {
      id,
      name,
      filters: filterState,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    const savedViews = [...get().savedViews, newView]
    set({ savedViews, currentViewId: id })
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews))
    } catch (e) {
      console.error('Failed to save view:', e)
    }
  },
  
  loadView: (viewId: string) => {
    const view = get().savedViews.find(v => v.id === viewId)
    if (view) {
      useFilterStore.getState().setFilters(view.filters)
      set({ currentViewId: viewId })
    }
  },
  
  deleteView: (viewId: string) => {
    const savedViews = get().savedViews.filter(v => v.id !== viewId)
    set({ 
      savedViews,
      currentViewId: get().currentViewId === viewId ? null : get().currentViewId,
    })
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews))
    } catch (e) {
      console.error('Failed to delete view:', e)
    }
  },
  
  updateView: (viewId: string, name: string) => {
    const savedViews = get().savedViews.map(v => 
      v.id === viewId ? { ...v, name, updatedAt: Date.now() } : v
    )
    set({ savedViews })
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews))
    } catch (e) {
      console.error('Failed to update view:', e)
    }
  },
  
  getCurrentViewName: () => {
    const { savedViews, currentViewId } = get()
    const view = savedViews.find(v => v.id === currentViewId)
    return view?.name || null
  },
}))
