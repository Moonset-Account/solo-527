import { useDrilldownStore } from '../stores/drilldown'
import { useFilterStore } from '../stores/filter'

export function useDrilldown() {
  const drillStore = useDrilldownStore()
  const filterStore = useFilterStore()

  function drillDown(level, id, label) {
    if (level === 'vehicle' && id) {
      filterStore.selectedVehicle = [id]
    } else if (level === 'route' && id) {
      filterStore.selectedRoute = [id]
    } else if (level === 'batch' && id) {
      filterStore.selectedBatch = [id]
    } else if (level === 'box' && id) {
      filterStore.selectedBox = [id]
    } else if (level === 'customer' && id) {
      filterStore.selectedCustomer = [id]
    } else if (level === 'overall') {
      filterStore.clearFilters()
    }
    drillStore.drillDown(level, id, label)
  }

  function goBack(index) {
    const drillPath = drillStore.drillPath
    for (let i = index + 1; i < drillPath.length; i++) {
      const lvl = drillPath[i].level
      if (lvl === 'vehicle') filterStore.selectedVehicle = []
      else if (lvl === 'route') filterStore.selectedRoute = []
      else if (lvl === 'batch') filterStore.selectedBatch = []
      else if (lvl === 'box') filterStore.selectedBox = []
      else if (lvl === 'customer') filterStore.selectedCustomer = []
    }
    drillStore.goBack(index)
  }

  function resetDrill() {
    filterStore.clearFilters()
    drillStore.resetDrill()
  }

  return {
    drillPath: drillStore.drillPath,
    currentLevel: drillStore.currentLevel,
    drillDown,
    goBack,
    resetDrill,
    DRILL_LABELS: drillStore.DRILL_LABELS
  }
}
