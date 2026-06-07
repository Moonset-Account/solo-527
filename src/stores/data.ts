import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CoreMetric,
  CohortData,
  FunnelStep,
  PriceTrendPoint,
  StoreRankItem,
  MedicineComparison,
  PrescriptionRangeStat,
  MedicineCategory,
} from '@/types'
import type {
  QueryFilter,
  CohortQueryParams,
} from '@/types/query'
import type { ClickHouseQueryResult } from '@/services/api/config'
import {
  queryCoreMetrics,
  queryCohortData,
  queryFunnelData,
  queryPriceTrend,
  queryStoreRank,
  queryMedicineComparison,
  queryPrescriptionRangeStats,
  clearQueryCache,
} from '@/services/clickhouse'
import { MEDICINE_CATEGORIES_KEY } from '@/utils/storage'
import { defaultMedicineCategories } from '@/utils/mock'

export const useDataStore = defineStore('data', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastQueryId = ref('')
  const lastExecutionTime = ref(0)

  const coreMetrics = ref<CoreMetric[]>([])
  const cohortData = ref<CohortData[]>([])
  const funnelData = ref<FunnelStep[]>([])
  const priceTrend = ref<PriceTrendPoint[]>([])
  const storeRank = ref<StoreRankItem[]>([])
  const medicineComparison = ref<MedicineComparison[]>([])
  const prescriptionRanges = ref<PrescriptionRangeStat[]>([])
  const medicineCategories = ref<MedicineCategory[]>([])

  const currentFilter = ref<QueryFilter>({
    chronicLabels: [],
    storeIds: [],
    regionIds: [],
    memberTier: [],
  })

  const hasActiveFilter = computed(() => {
    const f = currentFilter.value
    return (
      (f.chronicLabels && f.chronicLabels.length > 0) ||
      (f.storeIds && f.storeIds.length > 0) ||
      (f.memberTier && f.memberTier.length > 0) ||
      !!f.startDate ||
      !!f.endDate
    )
  })

  function updateFilter(filter: Partial<QueryFilter>) {
    currentFilter.value = { ...currentFilter.value, ...filter }
    clearQueryCache()
  }

  function setChronicLabels(labels: string[]) {
    currentFilter.value.chronicLabels = labels
    clearQueryCache()
  }

  function setStores(storeIds: string[]) {
    currentFilter.value.storeIds = storeIds
    clearQueryCache()
  }

  function setDateRange(start: string, end: string) {
    currentFilter.value.startDate = start
    currentFilter.value.endDate = end
    clearQueryCache()
  }

  function clearFilter() {
    currentFilter.value = {
      chronicLabels: [],
      storeIds: [],
      regionIds: [],
      memberTier: [],
    }
    clearQueryCache()
  }

  function wrapResult<T>(result: ClickHouseQueryResult<T>): T {
    lastQueryId.value = result.queryId
    lastExecutionTime.value = result.executionTime
    console.log('[DataStore] Query completed', {
      queryId: result.queryId,
      executionTime: result.executionTime,
      sampleSize: result.sampleSize,
      lowSample: result.lowSample,
    })
    return result.data
  }

  async function loadCoreMetrics() {
    loading.value = true
    error.value = null
    try {
      const result = await queryCoreMetrics(currentFilter.value)
      coreMetrics.value = wrapResult(result)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      console.error('[DataStore] loadCoreMetrics error', e)
    } finally {
      loading.value = false
    }
  }

  async function loadCohortData(params?: Partial<CohortQueryParams>) {
    loading.value = true
    error.value = null
    try {
      const queryParams = { ...currentFilter.value, ...params }
      const result = await queryCohortData(queryParams)
      cohortData.value = wrapResult(result)
      console.log('[DataStore] Cohort data loaded', {
        cohorts: cohortData.value.length,
        sampleSize: cohortData.value[0]?.cells[0]?.sampleSize,
        hasLowSample: cohortData.value.some(c => c.cells.some(cell => cell.lowSample)),
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      console.error('[DataStore] loadCohortData error', e)
    } finally {
      loading.value = false
    }
  }

  async function loadFunnelData(activityId: string = 'ACT-2024-001') {
    loading.value = true
    error.value = null
    try {
      const result = await queryFunnelData({ ...currentFilter.value, activityId })
      funnelData.value = wrapResult(result)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      console.error('[DataStore] loadFunnelData error', e)
    } finally {
      loading.value = false
    }
  }

  async function loadPriceTrend() {
    loading.value = true
    error.value = null
    try {
      const result = await queryPriceTrend(currentFilter.value)
      priceTrend.value = wrapResult(result)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      console.error('[DataStore] loadPriceTrend error', e)
    } finally {
      loading.value = false
    }
  }

  async function loadStoreRank() {
    loading.value = true
    error.value = null
    try {
      const result = await queryStoreRank(currentFilter.value)
      storeRank.value = wrapResult(result)
      console.log('[DataStore] Store rank loaded', {
        count: storeRank.value.length,
        stores: storeRank.value.map(s => s.storeName),
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      console.error('[DataStore] loadStoreRank error', e)
    } finally {
      loading.value = false
    }
  }

  async function loadMedicineComparison(activityId: string = 'ACT-2024-001', categories: string[] = []) {
    loading.value = true
    error.value = null
    try {
      const result = await queryMedicineComparison({
        ...currentFilter.value,
        activityId,
        targetCategories: categories,
      })
      medicineComparison.value = wrapResult(result)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      console.error('[DataStore] loadMedicineComparison error', e)
    } finally {
      loading.value = false
    }
  }

  async function loadPrescriptionRanges() {
    loading.value = true
    error.value = null
    try {
      const result = await queryPrescriptionRangeStats(currentFilter.value)
      prescriptionRanges.value = wrapResult(result)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      console.error('[DataStore] loadPrescriptionRanges error', e)
    } finally {
      loading.value = false
    }
  }

  function loadMedicineCategories() {
    try {
      const stored = localStorage.getItem(MEDICINE_CATEGORIES_KEY)
      if (stored) {
        medicineCategories.value = JSON.parse(stored)
      } else {
        medicineCategories.value = defaultMedicineCategories
      }
    } catch {
      medicineCategories.value = defaultMedicineCategories
    }
  }

  function saveMedicineCategories() {
    localStorage.setItem(MEDICINE_CATEGORIES_KEY, JSON.stringify(medicineCategories.value))
  }

  function addMedicineCategory(category: Omit<MedicineCategory, 'id'>) {
    const newCategory: MedicineCategory = {
      ...category,
      id: 'CAT_' + Date.now(),
    }
    medicineCategories.value.push(newCategory)
    saveMedicineCategories()
  }

  function updateMedicineCategory(id: string, updates: Partial<MedicineCategory>) {
    const index = medicineCategories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      medicineCategories.value[index] = { ...medicineCategories.value[index], ...updates }
      saveMedicineCategories()
    }
  }

  function deleteMedicineCategory(id: string) {
    medicineCategories.value = medicineCategories.value.filter(c => c.id !== id)
    saveMedicineCategories()
  }

  function refreshAll() {
    clearQueryCache()
    return Promise.all([
      loadCoreMetrics(),
      loadCohortData(),
      loadPriceTrend(),
      loadStoreRank(),
    ])
  }

  function init() {
    loadMedicineCategories()
  }

  return {
    loading,
    error,
    lastQueryId,
    lastExecutionTime,
    coreMetrics,
    cohortData,
    funnelData,
    priceTrend,
    storeRank,
    medicineComparison,
    prescriptionRanges,
    medicineCategories,
    currentFilter,
    hasActiveFilter,
    updateFilter,
    setChronicLabels,
    setStores,
    setDateRange,
    clearFilter,
    loadCoreMetrics,
    loadCohortData,
    loadFunnelData,
    loadPriceTrend,
    loadStoreRank,
    loadMedicineComparison,
    loadPrescriptionRanges,
    loadMedicineCategories,
    addMedicineCategory,
    updateMedicineCategory,
    deleteMedicineCategory,
    refreshAll,
    init,
  }
})
