import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchIngredients, fetchIngredient, createIngredient, updateIngredient, deleteIngredient, type Ingredient } from '@/api/ingredient'

export const useIngredientStore = defineStore('ingredient', () => {
  const list = ref<Ingredient[]>([])
  const current = ref<Ingredient | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const filters = ref<Record<string, unknown>>({})

  const loadList = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchIngredients({ ...filters.value, ...params })
      if (res && res.items) {
        list.value = res.items
        total.value = res.total
      } else if (Array.isArray(res)) {
        list.value = res
      }
    } finally {
      loading.value = false
    }
  }

  const loadDetail = async (id: string) => {
    loading.value = true
    try {
      const res: any = await fetchIngredient(id)
      current.value = res
    } finally {
      loading.value = false
    }
  }

  const add = async (data: Partial<Ingredient>) => {
    const res: any = await createIngredient(data)
    await loadList()
    return res
  }

  const edit = async (id: string, data: Partial<Ingredient>) => {
    const res: any = await updateIngredient(id, data)
    if (current.value?._id === id) current.value = res
    return res
  }

  const remove = async (id: string) => {
    await deleteIngredient(id)
    await loadList()
  }

  return { list, current, total, loading, filters, loadList, loadDetail, add, edit, remove }
})
