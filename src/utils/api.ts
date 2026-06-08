import { useFilterStore, type FilterState } from '@/store/filterStore'

export async function apiPost<T>(path: string, body?: Record<string, unknown>): Promise<{ data: T; meta: { updatedAt: string; cacheHit: boolean; filterSnapshot: FilterState; childDataAggregated: boolean } }> {
  const filters = useFilterStore.getState().filters
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || { filters }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'API请求失败')
  return json
}

export async function apiGet<T>(path: string): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const res = await fetch(path)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'API请求失败')
  return json
}
