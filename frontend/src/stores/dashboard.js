import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useDashboardStore = defineStore('dashboard', () => {
  const overview = ref(null)
  const timeoutAlerts = ref([])
  const resourceUtilization = ref(null)
  const workflowStats = ref(null)
  const loading = ref({
    overview: false,
    timeout: false,
    resource: false,
    workflow: false,
  })

  async function fetchOverview() {
    loading.value.overview = true
    try {
      const response = await request.get('/dashboard/overview')
      overview.value = response.data
      return response
    } finally {
      loading.value.overview = false
    }
  }

  async function fetchTimeoutAlerts(filters = {}) {
    loading.value.timeout = true
    try {
      const response = await request.get('/dashboard/timeout-alerts', {
        params: filters,
      })
      timeoutAlerts.value = response.data
      return response
    } finally {
      loading.value.timeout = false
    }
  }

  async function fetchResourceUtilization(filters = {}) {
    loading.value.resource = true
    try {
      const response = await request.get('/dashboard/resource-utilization', {
        params: filters,
      })
      resourceUtilization.value = response.data
      return response
    } finally {
      loading.value.resource = false
    }
  }

  async function fetchWorkflowStats(filters = {}) {
    loading.value.workflow = true
    try {
      const response = await request.get('/dashboard/workflow-stats', {
        params: filters,
      })
      workflowStats.value = response.data
      return response
    } finally {
      loading.value.workflow = false
    }
  }

  return {
    overview,
    timeoutAlerts,
    resourceUtilization,
    workflowStats,
    loading,
    fetchOverview,
    fetchTimeoutAlerts,
    fetchResourceUtilization,
    fetchWorkflowStats,
  }
})
