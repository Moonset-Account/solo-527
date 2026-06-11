export function useTodos() {
  const todos = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTodos(filters?: { status?: string; priority?: string; type?: string; assigneeId?: number }) {
    loading.value = true
    error.value = null
    try {
      const data: any = await $fetch('/api/todos', { query: filters })
      todos.value = Array.isArray(data) ? data : (data.data || data.todos || [])
      return todos.value
    } catch (e: any) {
      error.value = e.message || '获取待办失败'
      return []
    } finally {
      loading.value = false
    }
  }

  async function startTodo(id: number) {
    try {
      const result: any = await $fetch(`/api/todos/${id}/start`, { method: 'PUT' })
      const idx = todos.value.findIndex(t => t.id === id)
      if (idx !== -1) {
        todos.value[idx] = { ...todos.value[idx], ...result, status: 'IN_PROGRESS' }
      }
      return result
    } catch (e: any) {
      error.value = e.message || '开始处理失败'
      throw e
    }
  }

  async function completeTodo(id: number) {
    try {
      const result: any = await $fetch(`/api/todos/${id}/complete`, { method: 'PUT' })
      const idx = todos.value.findIndex(t => t.id === id)
      if (idx !== -1) {
        todos.value[idx] = { ...todos.value[idx], ...result, status: 'COMPLETED' }
      }
      return result
    } catch (e: any) {
      error.value = e.message || '办结失败'
      throw e
    }
  }

  return {
    todos,
    loading,
    error,
    fetchTodos,
    startTodo,
    completeTodo,
  }
}
