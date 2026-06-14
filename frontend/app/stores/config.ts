import { defineStore } from 'pinia'
import { ref } from 'vue'
import { configApi } from '~/utils/api'
import type { AcceptanceTemplate, InspectionTemplate, BudgetVersion, ConfigChangeLog } from '~/types'

export const useConfigStore = defineStore('config', () => {
  const acceptanceTemplates = ref<AcceptanceTemplate[]>([])
  const budgetVersions = ref<BudgetVersion[]>([])
  const inspectionTemplates = ref<InspectionTemplate[]>([])
  const changelog = ref<ConfigChangeLog[]>([])
  const acceptanceTotal = ref(0)
  const budgetTotal = ref(0)
  const inspectionTotal = ref(0)
  const changelogTotal = ref(0)
  const loading = ref(false)

  async function fetchAcceptanceTemplates(params?: { page?: number; page_size?: number }) {
    loading.value = true
    try {
      const res = await configApi.acceptanceTemplates(params)
      acceptanceTemplates.value = res.items
      acceptanceTotal.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function createAcceptanceTemplate(data: Partial<AcceptanceTemplate>) {
    return configApi.createAcceptanceTemplate(data)
  }

  async function updateAcceptanceTemplate(id: number, data: Partial<AcceptanceTemplate>) {
    return configApi.updateAcceptanceTemplate(id, data)
  }

  async function deleteAcceptanceTemplate(id: number) {
    return configApi.deleteAcceptanceTemplate(id)
  }

  async function fetchBudgetVersions(params?: { page?: number; page_size?: number; contract_id?: number }) {
    loading.value = true
    try {
      const res = await configApi.budgetVersions(params)
      budgetVersions.value = res.items
      budgetTotal.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function createBudgetVersion(data: Partial<BudgetVersion>) {
    return configApi.createBudgetVersion(data)
  }

  async function updateBudgetVersion(id: number, data: Partial<BudgetVersion>) {
    return configApi.updateBudgetVersion(id, data)
  }

  async function deleteBudgetVersion(id: number) {
    return configApi.deleteBudgetVersion(id)
  }

  async function fetchInspectionTemplates(params?: { page?: number; page_size?: number }) {
    loading.value = true
    try {
      const res = await configApi.inspectionTemplates(params)
      inspectionTemplates.value = res.items
      inspectionTotal.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function createInspectionTemplate(data: Partial<InspectionTemplate>) {
    return configApi.createInspectionTemplate(data)
  }

  async function updateInspectionTemplate(id: number, data: Partial<InspectionTemplate>) {
    return configApi.updateInspectionTemplate(id, data)
  }

  async function deleteInspectionTemplate(id: number) {
    return configApi.deleteInspectionTemplate(id)
  }

  async function fetchChangelog(params?: { page?: number; page_size?: number; entity_type?: string }) {
    try {
      const res = await configApi.changelog(params)
      changelog.value = res.items
      changelogTotal.value = res.total
    } catch {}
  }

  return {
    acceptanceTemplates, budgetVersions, inspectionTemplates, changelog,
    acceptanceTotal, budgetTotal, inspectionTotal, changelogTotal, loading,
    fetchAcceptanceTemplates, createAcceptanceTemplate, updateAcceptanceTemplate, deleteAcceptanceTemplate,
    fetchBudgetVersions, createBudgetVersion, updateBudgetVersion, deleteBudgetVersion,
    fetchInspectionTemplates, createInspectionTemplate, updateInspectionTemplate, deleteInspectionTemplate,
    fetchChangelog,
  }
})
