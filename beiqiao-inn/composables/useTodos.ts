export function fetchTodos(filters?: { status?: string; priority?: string; type?: string; assigneeId?: number }) {
  return useFetch('/api/todos', { query: filters })
}

export function completeTodo(id: number) {
  return $fetch(`/api/todos/${id}/complete`, { method: 'PUT' })
}
