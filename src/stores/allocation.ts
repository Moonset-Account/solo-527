import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AllocationRule, AllocationResult, AllocationMethod } from '../types'
import { mockAllocationRules } from '../mock'
import { allocateByArea, allocateByPeople, allocateByUsageRatio, allocateEven, getTimeRangeText } from '../utils'
import { useEnergyStore } from './energy'

export const useAllocationStore = defineStore('allocation', () => {
  const energyStore = useEnergyStore()
  
  const rules = ref<AllocationRule[]>(mockAllocationRules)
  const selectedRuleId = ref<string>(mockAllocationRules.find(r => r.isActive)?.id || '')
  const commonEnergy = ref<number>(2500)

  const activeRule = computed(() => rules.value.find(r => r.isActive))
  
  const period = computed(() => getTimeRangeText(energyStore.selectedTimeRange))
  
  const currentTenants = computed(() => energyStore.tenants)
  
  const tenantUsageMap = computed(() => energyStore.tenantUsageMap)

  const results = computed<AllocationResult[]>(() => {
    const rule = activeRule.value
    const tenants = currentTenants.value
    if (!rule || tenants.length === 0) return []

    let allocationResults: Omit<AllocationResult, 'id' | 'ruleId' | 'period'>[] = []
    
    switch (rule.method as AllocationMethod) {
      case 'by_area':
        allocationResults = allocateByArea(commonEnergy.value, tenants, tenantUsageMap.value)
        break
      case 'by_people':
        allocationResults = allocateByPeople(commonEnergy.value, tenants, tenantUsageMap.value)
        break
      case 'by_usage_ratio':
        allocationResults = allocateByUsageRatio(commonEnergy.value, tenants, tenantUsageMap.value)
        break
      case 'even':
        allocationResults = allocateEven(commonEnergy.value, tenants, tenantUsageMap.value)
        break
      default:
        allocationResults = allocateByArea(commonEnergy.value, tenants, tenantUsageMap.value)
    }

    return allocationResults.map((r, idx) => ({
      ...r,
      id: `result-${idx}`,
      ruleId: rule.id,
      period: period.value
    }))
  })

  const totalAllocated = computed(() => results.value.reduce((sum, r) => sum + r.allocatedEnergy, 0))
  const totalTenantUsage = computed(() => results.value.reduce((sum, r) => sum + r.tenantUsage, 0))
  const grandTotal = computed(() => totalAllocated.value + totalTenantUsage.value)

  function setActiveRule(ruleId: string): void {
    rules.value.forEach(r => {
      r.isActive = r.id === ruleId
    })
    selectedRuleId.value = ruleId
  }

  function updateCommonEnergy(value: number): void {
    commonEnergy.value = value
  }

  function addRule(rule: Omit<AllocationRule, 'id' | 'createdAt'>): void {
    rules.value.push({
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString()
    })
  }

  return {
    rules,
    selectedRuleId,
    commonEnergy,
    period,
    activeRule,
    results,
    totalAllocated,
    totalTenantUsage,
    grandTotal,
    currentTenants,
    tenantUsageMap,
    setActiveRule,
    updateCommonEnergy,
    addRule
  }
})
