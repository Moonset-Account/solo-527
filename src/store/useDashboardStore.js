import { reactive, watch } from 'vue'

const STORAGE_KEY = 'water-sports-dashboard-filters'

const defaultFilters = {
  sessionId: 'all',
  projectId: 'all',
  ageGroupId: 'all',
  coachId: 'all'
}

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load filters from storage:', e)
  }
  return { ...defaultFilters }
}

const state = reactive({
  filters: loadFromStorage(),
  currentUser: {
    role: 'manager',
    name: '营地负责人'
  },
  loading: false
})

watch(
  () => ({ ...state.filters }),
  (newFilters) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters))
    } catch (e) {
      console.warn('Failed to save filters to storage:', e)
    }
  },
  { deep: true }
)

export function useDashboardStore() {
  const setFilter = (key, value) => {
    state.filters[key] = value
  }

  const setFilters = (filters) => {
    Object.assign(state.filters, filters)
  }

  const resetFilters = () => {
    Object.assign(state.filters, { ...defaultFilters })
  }

  const hasPermission = (permission) => {
    const role = state.currentUser.role
    if (role === 'admin') return true
    const rolePermissions = {
      manager: ['view_dashboard', 'export_data', 'view_minor_aggregated', 'view_incident_photos_internal'],
      coach: ['view_dashboard', 'view_minor_aggregated'],
      auditor: ['view_dashboard', 'export_data', 'view_minor_aggregated', 'view_incident_photos_internal']
    }
    return rolePermissions[role]?.includes(permission) || false
  }

  const canViewIncidentPhotos = () => {
    return hasPermission('view_incident_photos_internal')
  }

  const canViewMinorAggregated = () => {
    return hasPermission('view_minor_aggregated')
  }

  const canExportData = () => {
    return hasPermission('export_data')
  }

  const setLoading = (loading) => {
    state.loading = loading
  }

  return {
    state,
    filters: state.filters,
    setFilter,
    setFilters,
    resetFilters,
    hasPermission,
    canViewIncidentPhotos,
    canViewMinorAggregated,
    canExportData,
    setLoading
  }
}
