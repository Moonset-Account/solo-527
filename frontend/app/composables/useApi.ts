import { ref } from 'vue'

export function useApi<T>() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<T | null>(null)

  async function execute(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const result = await fn()
      data.value = result
      return result
    } catch (e: any) {
      error.value = e?.data?.detail || e?.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, data, execute }
}
