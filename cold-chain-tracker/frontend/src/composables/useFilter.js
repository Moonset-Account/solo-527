import { computed } from 'vue'
import { useFilterStore } from '../stores/filter'

export function useFilter() {
  const store = useFilterStore()

  const filterOptions = {
    exceptionTypes: [
      { value: 'temp_high', label: '温度超标' },
      { value: 'temp_low', label: '温度过低' },
      { value: 'door_open', label: '门开启异常' },
      { value: 'humidity', label: '湿度异常' },
      { value: 'power_off', label: '断电异常' },
      { value: 'sensor_fault', label: '传感器故障' }
    ],
    severities: [
      { value: 'critical', label: '严重' },
      { value: 'major', label: '重要' },
      { value: 'minor', label: '轻微' }
    ]
  }

  function applyFilters() {
    return store.buildQueryParams()
  }

  function clearAll() {
    store.clearFilters()
  }

  const hasActiveFilters = computed(() => store.activeFilterCount > 0)

  return {
    store,
    filterOptions,
    applyFilters,
    clearAll,
    hasActiveFilters
  }
}
