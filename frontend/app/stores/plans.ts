import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { planApi } from '~/utils/api'
import type { Plan, MaterialItem, ConstructionNode } from '~/types'

export const usePlansStore = defineStore('plans', () => {
  const plans = ref<Plan[]>([])
  const currentPlan = ref<Plan | null>(null)
  const loading = ref(false)
  const total = ref(0)

  const styleOptions = computed(() => {
    const styles = new Set(plans.value.map(p => p.style).filter(Boolean))
    return Array.from(styles).map(s => ({ label: s, value: s }))
  })

  function getPlaceholderImage(seed: number, width = 400, height = 300) {
    const colors = ['1B2A4A', '2d4a7a', 'E8A838', '36B37E', 'FF4D4F']
    const color = colors[seed % colors.length]
    return `https://picsum.photos/seed/${seed}/${width}/${height}`
  }

  function getPlanCover(plan: Plan): string {
    if (plan.cover_images && plan.cover_images.length > 0) {
      return plan.cover_images[0]!
    }
    return getPlaceholderImage(plan.id)
  }

  function getPlanImages(plan: Plan): string[] {
    if (plan.cover_images && plan.cover_images.length > 0) {
      return plan.cover_images
    }
    return [
      getPlaceholderImage(plan.id, 800, 500),
      getPlaceholderImage(plan.id + 1, 800, 500),
      getPlaceholderImage(plan.id + 2, 800, 500),
    ]
  }

  function getMaterials(plan: Plan): MaterialItem[] {
    if (plan.materials && Array.isArray(plan.materials)) {
      return plan.materials
    }
    return [
      { name: '地砖', brand: '东鹏', model: 'DP-8001', quantity: 120, unit: '块', price: 85 },
      { name: '木地板', brand: '圣象', model: 'SX-2023', quantity: 80, unit: '㎡', price: 280 },
      { name: '乳胶漆', brand: '立邦', model: '净味120', quantity: 20, unit: '桶', price: 380 },
      { name: '橱柜', brand: '欧派', model: 'OP-001', quantity: 6, unit: '延米', price: 2500 },
      { name: '洁具', brand: 'TOTO', model: 'TOTO-001', quantity: 3, unit: '套', price: 4500 },
    ]
  }

  function getConstructionNodes(plan: Plan): ConstructionNode[] {
    return [
      { name: '主体拆改', duration: 7, description: '根据设计图纸进行墙体拆改' },
      { name: '水电改造', duration: 10, description: '水电线路重新布局和铺设' },
      { name: '泥瓦工程', duration: 15, description: '地面找平、墙面抹灰、瓷砖铺贴' },
      { name: '木工工程', duration: 12, description: '吊顶、柜子、门窗套制作' },
      { name: '油漆工程', duration: 10, description: '墙面刮腻子、刷乳胶漆' },
      { name: '安装工程', duration: 8, description: '灯具、洁具、五金安装' },
      { name: '竣工验收', duration: 3, description: '整体验收和清洁' },
    ]
  }

  function get3DImages(plan: Plan): string[] {
    return [
      getPlaceholderImage(plan.id + 10, 600, 400),
      getPlaceholderImage(plan.id + 11, 600, 400),
      getPlaceholderImage(plan.id + 12, 600, 400),
      getPlaceholderImage(plan.id + 13, 600, 400),
      getPlaceholderImage(plan.id + 14, 600, 400),
      getPlaceholderImage(plan.id + 15, 600, 400),
    ]
  }

  async function loadPlans(params?: { page?: number; page_size?: number; status?: string; style?: string; search?: string }) {
    loading.value = true
    try {
      const res = await planApi.list(params)
      plans.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function loadPlan(id: number) {
    loading.value = true
    try {
      currentPlan.value = await planApi.get(id)
      return currentPlan.value
    } finally {
      loading.value = false
    }
  }

  async function createPlan(data: Partial<Plan>) {
    const res = await planApi.create(data)
    plans.value.unshift(res)
    return res
  }

  async function updatePlan(id: number, data: Partial<Plan>) {
    const res = await planApi.update(id, data)
    const index = plans.value.findIndex(p => p.id === id)
    if (index !== -1) {
      plans.value[index] = res
    }
    if (currentPlan.value?.id === id) {
      currentPlan.value = res
    }
    return res
  }

  async function deletePlan(id: number) {
    await planApi.delete(id)
    plans.value = plans.value.filter(p => p.id !== id)
    if (currentPlan.value?.id === id) {
      currentPlan.value = null
    }
  }

  function clearCurrent() {
    currentPlan.value = null
  }

  return {
    plans,
    currentPlan,
    loading,
    total,
    styleOptions,
    getPlanCover,
    getPlanImages,
    getMaterials,
    getConstructionNodes,
    get3DImages,
    loadPlans,
    loadPlan,
    createPlan,
    updatePlan,
    deletePlan,
    clearCurrent,
  }
})
