import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterState } from '@/types'
import { getFilterOptions } from '@/data/api'

export const useFilterStore = defineStore('filter', () => {
  const accounts = ref<string[]>([])
  const categories = ref<string[]>([])
  const members = ref<string[]>([])
  const months = ref<string[]>([])
  const merchants = ref<string[]>([])
  const excludeAbnormal = ref(false)
  const hiddenAccounts = ref<string[]>([])

  const options = ref(getFilterOptions())

  const filterState = computed<FilterState>(() => ({
    accounts: accounts.value,
    categories: categories.value,
    members: members.value,
    months: months.value,
    merchants: merchants.value,
    excludeAbnormal: excludeAbnormal.value,
    hiddenAccounts: hiddenAccounts.value,
  }))

  const activeFilterCount = computed(() => {
    let count = 0
    if (accounts.value.length > 0) count++
    if (categories.value.length > 0) count++
    if (members.value.length > 0) count++
    if (months.value.length > 0) count++
    if (merchants.value.length > 0) count++
    if (excludeAbnormal.value) count++
    return count
  })

  const filterSummary = computed(() => {
    const parts: string[] = []
    if (accounts.value.length > 0) parts.push(`账户:${accounts.value.length}项`)
    if (categories.value.length > 0) parts.push(`分类:${categories.value.length}项`)
    if (members.value.length > 0) parts.push(`成员:${members.value.length}项`)
    if (months.value.length > 0) parts.push(`月份:${months.value.length}项`)
    if (merchants.value.length > 0) parts.push(`商户:${merchants.value.length}项`)
    if (excludeAbnormal.value) parts.push('已排除异常')
    return parts.length > 0 ? parts.join(' | ') : '无筛选条件'
  })

  function setFilter(field: keyof FilterState, value: string[] | boolean) {
    switch (field) {
      case 'accounts': accounts.value = value as string[]; break
      case 'categories': categories.value = value as string[]; break
      case 'members': members.value = value as string[]; break
      case 'months': months.value = value as string[]; break
      case 'merchants': merchants.value = value as string[]; break
      case 'excludeAbnormal': excludeAbnormal.value = value as boolean; break
      case 'hiddenAccounts': hiddenAccounts.value = value as string[]; break
    }
  }

  function clearAll() {
    accounts.value = []
    categories.value = []
    members.value = []
    months.value = []
    merchants.value = []
    excludeAbnormal.value = false
    hiddenAccounts.value = []
  }

  function toggleCategoryDrilldown(category: string) {
    if (categories.value.includes(category)) {
      categories.value = categories.value.filter(c => c !== category)
    } else {
      categories.value = [category]
    }
  }

  function toggleAccount(account: string) {
    if (hiddenAccounts.value.includes(account)) {
      hiddenAccounts.value = hiddenAccounts.value.filter(a => a !== account)
    } else {
      hiddenAccounts.value = [...hiddenAccounts.value, account]
    }
  }

  return {
    accounts,
    categories,
    members,
    months,
    merchants,
    excludeAbnormal,
    hiddenAccounts,
    options,
    filterState,
    activeFilterCount,
    filterSummary,
    setFilter,
    clearAll,
    toggleCategoryDrilldown,
    toggleAccount,
  }
})
