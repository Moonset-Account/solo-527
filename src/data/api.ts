import type {
  Transaction,
  BudgetItem,
  Subscription,
  CategoryRule,
  FilterState,
  CashFlowPoint,
  CategoryBreakdownItem,
  DataMeta,
  Account,
} from '@/types'

const BASE = '/api'

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function patch<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { method: 'PATCH' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function del<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function put<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchFilteredTransactions(filter: FilterState): Promise<{ data: Transaction[]; meta: { updatedAt: string; sampleSize: number } }> {
  return post('/transactions', filter)
}

export async function fetchBudgetProgress(filter: FilterState): Promise<BudgetItem[]> {
  return post('/budget-progress', filter)
}

export async function fetchCategoryBreakdown(filter: FilterState): Promise<CategoryBreakdownItem[]> {
  return post('/category-breakdown', filter)
}

export async function fetchCashFlow(filter: FilterState): Promise<CashFlowPoint[]> {
  return post('/cash-flow', filter)
}

export async function fetchAbnormalSamples(filter: FilterState): Promise<Transaction[]> {
  return post('/abnormal-samples', filter)
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  return get('/subscriptions')
}

export async function toggleSubscriptionHandled(id: string): Promise<Subscription> {
  return patch(`/subscriptions/${id}`)
}

export async function fetchRules(): Promise<CategoryRule[]> {
  return get('/rules')
}

export async function addRule(rule: CategoryRule): Promise<CategoryRule> {
  return post('/rules', rule)
}

export async function updateRule(rule: CategoryRule): Promise<CategoryRule> {
  return put(`/rules/${rule.id}`, rule)
}

export async function deleteRule(id: string): Promise<{ ok: boolean }> {
  return del(`/rules/${id}`)
}

export async function fetchMeta(): Promise<{ updatedAt: string }> {
  return get('/meta')
}

export async function getAccounts(): Promise<Account[]> {
  return get('/accounts')
}

export async function getFilterOptions(): Promise<{
  accounts: string[]
  categories: string[]
  members: string[]
  months: string[]
  merchants: string[]
}> {
  return get('/filter-options')
}

export function fetchDataMeta(updatedAt: string, filter: FilterState, sampleSize: number): DataMeta {
  return {
    updatedAt,
    filterSnapshot: { ...filter },
    sampleSize,
  }
}
