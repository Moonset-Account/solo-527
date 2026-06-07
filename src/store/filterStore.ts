import { create } from 'zustand'
import type { FilterState } from '../types'

interface FilterStore extends FilterState {
  setEquipmentIds: (ids: string[]) => void
  setProductionLines: (lines: string[]) => void
  setShifts: (shifts: ('早班' | '中班' | '夜班')[]) => void
  setFaultTypes: (types: string[]) => void
  setMaintenancePersonIds: (ids: string[]) => void
  setDowntimeMode: (mode: 'all' | 'planned' | 'unplanned') => void
  setDateRange: (range: [string, string]) => void
  resetFilters: () => void
  getFilterDescription: () => string
}

const initialState: FilterState = {
  equipmentIds: [],
  productionLines: [],
  shifts: [],
  faultTypes: [],
  maintenancePersonIds: [],
  downtimeMode: 'all',
  dateRange: ['', ''],
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...initialState,

  setEquipmentIds: (ids) => set({ equipmentIds: ids }),
  setProductionLines: (lines) => set({ productionLines: lines }),
  setShifts: (shifts) => set({ shifts }),
  setFaultTypes: (types) => set({ faultTypes: types }),
  setMaintenancePersonIds: (ids) => set({ maintenancePersonIds: ids }),
  setDowntimeMode: (mode) => set({ downtimeMode: mode }),
  setDateRange: (range) => set({ dateRange: range }),
  resetFilters: () => set(initialState),

  getFilterDescription: () => {
    const state = get()
    const parts: string[] = []

    if (state.dateRange[0] && state.dateRange[1]) {
      parts.push(`日期: ${state.dateRange[0]} ~ ${state.dateRange[1]}`)
    }

    if (state.productionLines.length > 0) {
      parts.push(`产线: ${state.productionLines.join('、')}`)
    }

    if (state.shifts.length > 0) {
      parts.push(`班次: ${state.shifts.join('、')}`)
    }

    if (state.faultTypes.length > 0) {
      parts.push(`故障类型: ${state.faultTypes.join('、')}`)
    }

    if (state.equipmentIds.length > 0) {
      parts.push(`设备: ${state.equipmentIds.length}台`)
    }

    if (state.maintenancePersonIds.length > 0) {
      parts.push(`维修人员: ${state.maintenancePersonIds.length}人`)
    }

    if (state.downtimeMode !== 'all') {
      const modeLabel = state.downtimeMode === 'planned' ? '计划停机' : '非计划停机'
      parts.push(`停机模式: ${modeLabel}`)
    }

    return parts.length > 0 ? parts.join(' | ') : '未设置筛选条件'
  },
}))
