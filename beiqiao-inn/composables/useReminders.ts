export function fetchReminders(filters?: { priority?: string; isRead?: boolean }) {
  return useFetch('/api/reminders', { query: filters })
}

export function markRead(id: number) {
  return $fetch(`/api/reminders/${id}/read`, { method: 'PUT' })
}

export function fetchRules() {
  return useFetch('/api/reminders/rules')
}

export function createRule(data: { name: string; condition: Record<string, unknown>; priority: string; enabled?: boolean }) {
  return $fetch('/api/reminders/rules', { method: 'POST', body: data })
}

export function updateRule(id: number, data: { name?: string; condition?: Record<string, unknown>; priority?: string; enabled?: boolean }) {
  return $fetch(`/api/reminders/rules/${id}`, { method: 'PUT', body: data })
}
