import type {
  Transaction,
  BudgetItem,
  Subscription,
  CategoryRule,
  FilterState,
  CashFlowPoint,
  CategoryBreakdownItem,
  DataMeta,
} from '@/types'
import {
  getTransactions,
  getBudgets,
  getSubscriptions,
  getRules,
  getAccounts,
  getMembers,
  getAllMerchants,
  ALL_MONTHS,
} from './mock'
import { cleanTransactions, detectAbnormal, aggregateCashFlow, aggregateCategoryBreakdown, computeBudgetProgress } from './clean'
import { LRUCache, buildCacheKey } from './cache'

const cache = new LRUCache<unknown>(100)
let dataUpdatedAt = new Date().toISOString()

export function getDataUpdatedAt(): string {
  return dataUpdatedAt
}

export function refreshUpdateTime(): void {
  dataUpdatedAt = new Date().toISOString()
  cache.clear()
}

export function fetchFilteredTransactions(filter: FilterState): Transaction[] {
  const key = buildCacheKey('tx', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key) as Transaction[] | null
  if (cached) return cached
  const result = cleanTransactions(getTransactions(), filter)
  cache.set(key, result)
  return result
}

export function fetchBudgetProgress(filter: FilterState): BudgetItem[] {
  const key = buildCacheKey('budget', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key) as BudgetItem[] | null
  if (cached) return cached
  const txs = fetchFilteredTransactions(filter)
  const result = computeBudgetProgress(txs, getBudgets())
  cache.set(key, result)
  return result
}

export function fetchCategoryBreakdown(filter: FilterState): CategoryBreakdownItem[] {
  const key = buildCacheKey('cat', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key) as CategoryBreakdownItem[] | null
  if (cached) return cached
  const txs = fetchFilteredTransactions(filter)
  const result = aggregateCategoryBreakdown(txs)
  cache.set(key, result)
  return result
}

export function fetchCashFlow(filter: FilterState): CashFlowPoint[] {
  const key = buildCacheKey('cf', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key) as CashFlowPoint[] | null
  if (cached) return cached
  const txs = fetchFilteredTransactions(filter)
  const result = aggregateCashFlow(txs)
  cache.set(key, result)
  return result
}

export function fetchAbnormalSamples(filter: FilterState): Transaction[] {
  const key = buildCacheKey('abn', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key) as Transaction[] | null
  if (cached) return cached
  const txs = fetchFilteredTransactions({ ...filter, excludeAbnormal: false })
  const result = detectAbnormal(txs)
  cache.set(key, result)
  return result
}

export function fetchSubscriptions(): Subscription[] {
  return getSubscriptions()
}

export function fetchRules(): CategoryRule[] {
  return getRules()
}

export function updateRule(rule: CategoryRule): void {
  const rules = getRules()
  const idx = rules.findIndex(r => r.id === rule.id)
  if (idx >= 0) rules[idx] = rule
  refreshUpdateTime()
}

export function addRule(rule: CategoryRule): void {
  getRules().push(rule)
  refreshUpdateTime()
}

export function deleteRule(id: string): void {
  const rules = getRules()
  const idx = rules.findIndex(r => r.id === id)
  if (idx >= 0) rules.splice(idx, 1)
  refreshUpdateTime()
}

export function toggleSubscriptionHandled(id: string): void {
  const subs = getSubscriptions()
  const sub = subs.find(s => s.id === id)
  if (sub) sub.isHandled = !sub.isHandled
}

export function fetchDataMeta(filter: FilterState, sampleSize: number): DataMeta {
  return {
    updatedAt: dataUpdatedAt,
    filterSnapshot: { ...filter },
    sampleSize,
  }
}

export function getFilterOptions() {
  return {
    accounts: getAccounts().map(a => a.name),
    categories: Object.keys({ '收入': [], '固定支出': [], '订阅': [], '购物': [], '旅行': [], '信用卡': [] }),
    members: getMembers().map(m => m.name),
    months: ALL_MONTHS,
    merchants: getAllMerchants(),
  }
}
