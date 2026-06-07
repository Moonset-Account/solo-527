import { create } from 'zustand'
import type { WarehouseType } from '@/types'

interface AppState {
  warehouseType: WarehouseType
  setWarehouseType: (type: WarehouseType) => void
  selectedSKU: string | null
  setSelectedSKU: (sku: string | null) => void
  detailDrawerOpen: boolean
  setDetailDrawerOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  warehouseType: 'all',
  setWarehouseType: (type) => set({ warehouseType: type }),
  selectedSKU: null,
  setSelectedSKU: (sku) => set({ selectedSKU: sku, detailDrawerOpen: sku !== null }),
  detailDrawerOpen: false,
  setDetailDrawerOpen: (open) => set({ detailDrawerOpen: open, selectedSKU: open ? undefined : null }),
}))
