import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchRecipes, fetchRecipe, createRecipe, updateRecipe, deleteRecipe, type Recipe } from '@/api/recipe'

export const useRecipeStore = defineStore('recipe', () => {
  const list = ref<Recipe[]>([])
  const current = ref<Recipe | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const filters = ref<Record<string, unknown>>({})

  const loadList = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchRecipes({ ...filters.value, ...params })
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
      const res: any = await fetchRecipe(id)
      current.value = res
    } finally {
      loading.value = false
    }
  }

  const add = async (data: Partial<Recipe>) => {
    const res: any = await createRecipe(data)
    await loadList()
    return res
  }

  const edit = async (id: string, data: Partial<Recipe>) => {
    const res: any = await updateRecipe(id, data)
    if (current.value?._id === id) current.value = res
    return res
  }

  const remove = async (id: string) => {
    await deleteRecipe(id)
    await loadList()
  }

  return { list, current, total, loading, filters, loadList, loadDetail, add, edit, remove }
})
