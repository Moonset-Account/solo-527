import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CategoryRule } from '@/types'
import { fetchRules, addRule, updateRule, deleteRule } from '@/data/api'

export const usePrivacyStore = defineStore('privacy', () => {
  const showPersonalDetails = ref(true)
  const rules = ref<CategoryRule[]>([])

  const sharedRules = ref<CategoryRule[]>([])
  const personalRules = ref<CategoryRule[]>([])

  function loadRules() {
    rules.value = fetchRules()
    sharedRules.value = rules.value.filter(r => r.scope === 'shared')
    personalRules.value = rules.value.filter(r => r.scope === 'personal')
  }

  function togglePersonalVisibility() {
    showPersonalDetails.value = !showPersonalDetails.value
  }

  function addNewRule(rule: CategoryRule) {
    addRule(rule)
    loadRules()
  }

  function editRule(rule: CategoryRule) {
    updateRule(rule)
    loadRules()
  }

  function removeRule(id: string) {
    deleteRule(id)
    loadRules()
  }

  return {
    showPersonalDetails,
    rules,
    sharedRules,
    personalRules,
    loadRules,
    togglePersonalVisibility,
    addNewRule,
    editRule,
    removeRule,
  }
})
