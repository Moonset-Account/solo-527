import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SystemConfig {
  servicePhone: string
  serviceTime: string
  serviceAreas: string[]
}

export const useAppStore = defineStore('app', () => {
  const config = ref<SystemConfig>({
    servicePhone: '400-888-8888',
    serviceTime: '周一至周日 8:00-20:00',
    serviceAreas: ['全市区']
  })

  const isDemoMode = ref(import.meta.env.VITE_DEMO_MODE === 'true')

  function updateConfig(newConfig: Partial<SystemConfig>) {
    config.value = { ...config.value, ...newConfig }
  }

  return {
    config,
    isDemoMode,
    updateConfig
  }
})
