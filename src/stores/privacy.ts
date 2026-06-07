import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CategoryRule, Account } from '@/types'
import { fetchRules, addRule, updateRule, deleteRule, getAccounts } from '@/data/api'
import { useFilterStore } from './filter'

export const usePrivacyStore = defineStore('privacy', () => {
  const showPersonalDetails = ref(true)
  const rules = ref<CategoryRule[]>([])
  const _accounts = ref<Account[]>([])

  const sharedRules = ref<CategoryRule[]>([])
  const personalRules = ref<CategoryRule[]>([])

  const personalAccounts = computed<Account[]>(() => {
    return _accounts.value.filter(a => a.type === 'credit' || a.owner !== '爸爸')
  })

  function syncHiddenAccounts() {
    const filterStore = useFilterStore()
    if (showPersonalDetails.value) {
      filterStore.setHiddenAccounts([])
    } else {
      const hiddenNames = personalAccounts.value.map(a => a.name)
      filterStore.setHiddenAccounts(hiddenNames)
    }
  }

  async function loadRules() {
    rules.value = await fetchRules()
    sharedRules.value = rules.value.filter(r => r.scope === 'shared')
    personalRules.value = rules.value.filter(r => r.scope === 'personal')
  }

  async function loadAccounts() {
    _accounts.value = await getAccounts()
  }

  function togglePersonalVisibility() {
    showPersonalDetails.value = !showPersonalDetails.value
    syncHiddenAccounts()
  }

  async function addNewRule(rule: CategoryRule) {
    await addRule(rule)
    await loadRules()
  }

  async function editRule(rule: CategoryRule) {
    await updateRule(rule)
    await loadRules()
  }

  async function removeRule(id: string) {
    await deleteRule(id)
    await loadRules()
  }

  return {
    showPersonalDetails,
    rules,
    sharedRules,
    personalRules,
    personalAccounts,
    syncHiddenAccounts,
    loadRules,
    loadAccounts,
    togglePersonalVisibility,
    addNewRule,
    editRule,
    removeRule,
  }
})
