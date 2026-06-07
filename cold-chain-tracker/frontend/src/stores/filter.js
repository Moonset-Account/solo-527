import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  const dateRange = ref(null)
  const selectedVehicle = ref([])
  const selectedRoute = ref([])
  const selectedBatch = ref([])
  const selectedBox = ref([])
  const selectedCustomer = ref([])
  const exceptionType = ref('')
  const severity = ref('')

  function setFilter(key, value) {
    if (key in { dateRange, selectedVehicle, selectedRoute, selectedBatch, selectedBox, selectedCustomer, exceptionType, severity }) {
      const map = { dateRange, selectedVehicle, selectedRoute, selectedBatch, selectedBox, selectedCustomer, exceptionType, severity }
      map[key].value = value
    }
  }

  function clearFilters() {
    dateRange.value = null
    selectedVehicle.value = []
    selectedRoute.value = []
    selectedBatch.value = []
    selectedBox.value = []
    selectedCustomer.value = []
    exceptionType.value = ''
    severity.value = ''
  }

  const activeFilterCount = computed(() => {
    let count = 0
    if (dateRange.value) count++
    if (selectedVehicle.value.length) count++
    if (selectedRoute.value.length) count++
    if (selectedBatch.value.length) count++
    if (selectedBox.value.length) count++
    if (selectedCustomer.value.length) count++
    if (exceptionType.value) count++
    if (severity.value) count++
    return count
  })

  const filterParams = computed(() => {
    const params = {}
    if (dateRange.value) {
      params.date_start = dateRange.value[0]
      params.date_end = dateRange.value[1]
    }
    if (selectedVehicle.value.length) params.vehicle_id = selectedVehicle.value.join(',')
    if (selectedRoute.value.length) params.route_id = selectedRoute.value.join(',')
    if (selectedBatch.value.length) params.batch_id = selectedBatch.value.join(',')
    if (selectedBox.value.length) params.box_id = selectedBox.value.join(',')
    if (selectedCustomer.value.length) params.customer = selectedCustomer.value.join(',')
    if (exceptionType.value) params.exception_type = exceptionType.value
    if (severity.value) params.severity = severity.value
    return params
  })

  function buildQueryParams() {
    return filterParams.value
  }

  return {
    dateRange, selectedVehicle, selectedRoute, selectedBatch,
    selectedBox, selectedCustomer, exceptionType, severity,
    setFilter, clearFilters, buildQueryParams,
    activeFilterCount, filterParams
  }
})
