import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CoreMetric,
  CohortData,
  FunnelStep,
  StoreData,
  MemberTier,
  MedicineComparison,
  PriceTrendPoint,
  PrescriptionRangeStat,
  ChronicTag,
  MedicineCategory
} from '@/types'
import {
  generateCoreMetrics,
  generateCohortData,
  generateFunnelData,
  generateStoreData,
  generateMemberTiers,
  generateMedicineComparison,
  generatePriceTrend,
  generatePrescriptionStats,
  generateChronicTags,
  generateMedicineCategories
} from '@/utils/mock'

const CACHE_KEY = 'store_cache_data'
const CACHE_EXPIRY = 30 * 60 * 1000

export const useDataStore = defineStore('data', () => {
  const coreMetrics = ref<CoreMetric[]>([])
  const cohortData = ref<CohortData[]>([])
  const funnelData = ref<FunnelStep[]>([])
  const storeData = ref<StoreData[]>([])
  const memberTiers = ref<MemberTier[]>([])
  const medicineComparison = ref<MedicineComparison[]>([])
  const priceTrend = ref<PriceTrendPoint[]>([])
  const prescriptionStats = ref<PrescriptionRangeStat[]>([])
  const chronicTags = ref<ChronicTag[]>([])
  const medicineCategories = ref<MedicineCategory[]>([])
  
  const loading = ref(false)
  const selectedRegion = ref<string>('all')
  const selectedDateRange = ref<[Date, Date] | null>(null)

  const filteredStoreData = computed(() => {
    if (selectedRegion.value === 'all') return storeData.value
    return storeData.value.filter(s => s.region === selectedRegion.value)
  })

  const allRegions = computed(() => {
    const regions = new Set(storeData.value.map(s => s.region))
    return Array.from(regions)
  })

  async function loadAllData(forceRefresh = false) {
    loading.value = true
    
    try {
      if (!forceRefresh) {
        const cached = loadFromCache()
        if (cached) {
          applyCachedData(cached)
          loading.value = false
          return
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      coreMetrics.value = generateCoreMetrics()
      cohortData.value = generateCohortData()
      funnelData.value = generateFunnelData()
      storeData.value = generateStoreData()
      memberTiers.value = generateMemberTiers()
      medicineComparison.value = generateMedicineComparison()
      priceTrend.value = generatePriceTrend()
      prescriptionStats.value = generatePrescriptionStats()
      chronicTags.value = generateChronicTags()
      medicineCategories.value = generateMedicineCategories()
      
      saveToCache()
    } finally {
      loading.value = false
    }
  }

  function saveToCache() {
    const data = {
      timestamp: Date.now(),
      coreMetrics: coreMetrics.value,
      cohortData: cohortData.value,
      funnelData: funnelData.value,
      storeData: storeData.value,
      memberTiers: memberTiers.value,
      medicineComparison: medicineComparison.value,
      priceTrend: priceTrend.value,
      prescriptionStats: prescriptionStats.value,
      chronicTags: chronicTags.value,
      medicineCategories: medicineCategories.value
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  }

  function loadFromCache(): any | null {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    try {
      const data = JSON.parse(cached)
      if (Date.now() - data.timestamp < CACHE_EXPIRY) {
        return data
      }
      localStorage.removeItem(CACHE_KEY)
    } catch {
      localStorage.removeItem(CACHE_KEY)
    }
    return null
  }

  function applyCachedData(data: any) {
    coreMetrics.value = data.coreMetrics || []
    cohortData.value = data.cohortData || []
    funnelData.value = data.funnelData || []
    storeData.value = data.storeData || []
    memberTiers.value = data.memberTiers || []
    medicineComparison.value = data.medicineComparison || []
    priceTrend.value = data.priceTrend || []
    prescriptionStats.value = data.prescriptionStats || []
    chronicTags.value = data.chronicTags || []
    medicineCategories.value = data.medicineCategories || []
  }

  function clearCache() {
    localStorage.removeItem(CACHE_KEY)
  }

  function setRegion(region: string) {
    selectedRegion.value = region
  }

  function updateMedicineCategory(categories: MedicineCategory[]) {
    medicineCategories.value = categories
    saveToCache()
  }

  return {
    coreMetrics,
    cohortData,
    funnelData,
    storeData,
    memberTiers,
    medicineComparison,
    priceTrend,
    prescriptionStats,
    chronicTags,
    medicineCategories,
    loading,
    selectedRegion,
    selectedDateRange,
    filteredStoreData,
    allRegions,
    loadAllData,
    clearCache,
    setRegion,
    updateMedicineCategory
  }
})
