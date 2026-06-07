import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AllocationRule, AllocationResult, AllocationMethod } from '../types'
import { mockAllocationRules, mockTenants } from '../mock'
import { allocateByArea, allocateByPeople, allocateByUsageRatio, allocateEven } from '../utils'

export const useAllocationStore = defineStore('allocation', () => {
  const rules = ref<AllocationRule[]>(mockAllocationRules)
  const selectedRuleId = ref<string>(mockAllocationRules.find(r => r.isActive)?.id || '')
  const commonEnergy = ref<number>(2500)
  const period = ref<string>('2025年6月')

  const activeRule = computed(() => rules.value.find(r => r.isActive))

  const results = computed<AllocationResult[]>(() => {
    const rule = activeRule.value
    if (!rule) return []

    let allocationResults: Omit<AllocationResult, 'id' | 'ruleId' | 'period'>[] = []
    
    switch (rule.method as AllocationMethod) {
      case 'by_area':
        allocationResults = allocateByArea(commonEnergy.value, mockTenants)
        break
      case 'by_people':
        allocationResults = allocateByPeople(commonEnergy.value, mockTenants)
        break
      case 'by_usage_ratio':
        allocationResults = allocateByUsageRatio(commonEnergy.value, mockTenants)
        break
      case 'even':
        allocationResults = allocateEven(commonEnergy.value, mockTenants)
        break
      default:
        allocationResults = allocateByArea(commonEnergy.value, mockTenants)
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
    setActiveRule,
    updateCommonEnergy,
    addRule
  }
})
