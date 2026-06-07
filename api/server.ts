import express from 'express'
import cors from 'cors'
import type { FilterState, CategoryRule } from './types.js'
import { transactions, budgets, subscriptions, rules, accounts, members, allMerchants, allMonths } from './mock.js'
import { cleanTransactions, detectAbnormal, aggregateCashFlow, aggregateCategoryBreakdown, computeBudgetProgress } from './clean.js'
import { LRUCache, buildCacheKey } from './cache.js'

const app = express()
app.use(cors())
app.use(express.json())

const cache = new LRUCache<unknown>(200)
let dataUpdatedAt = new Date().toISOString()

function refreshUpdateTime() {
  dataUpdatedAt = new Date().toISOString()
  cache.clear()
}

function parseFilter(body: Partial<FilterState>): FilterState {
  return {
    accounts: body.accounts || [],
    categories: body.categories || [],
    members: body.members || [],
    months: body.months || [],
    merchants: body.merchants || [],
    excludeAbnormal: body.excludeAbnormal || false,
    hiddenAccounts: body.hiddenAccounts || [],
    excludedTxIds: body.excludedTxIds || [],
  }
}

app.get('/api/meta', (_req, res) => {
  res.json({ updatedAt: dataUpdatedAt })
})

app.get('/api/filter-options', (_req, res) => {
  res.json({
    accounts: accounts.map(a => a.name),
    categories: Object.keys({ '收入': [], '固定支出': [], '订阅': [], '购物': [], '旅行': [], '信用卡': [] }),
    members: members.map(m => m.name),
    months: allMonths,
    merchants: allMerchants,
  })
})

app.post('/api/transactions', (req, res) => {
  const filter = parseFilter(req.body)
  const key = buildCacheKey('tx', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key) as { data: Transaction[]; meta: { updatedAt: string; sampleSize: number } } | null
  if (cached) { res.json(cached); return }
  const result = cleanTransactions(transactions, filter)
  const response = { data: result, meta: { updatedAt: dataUpdatedAt, sampleSize: result.length } }
  cache.set(key, response)
  res.json(response)
})

app.post('/api/budget-progress', (req, res) => {
  const filter = parseFilter(req.body)
  const key = buildCacheKey('budget', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key)
  if (cached) { res.json(cached); return }
  const txs = cleanTransactions(transactions, filter)
  const result = computeBudgetProgress(txs, budgets)
  cache.set(key, result)
  res.json(result)
})

app.post('/api/category-breakdown', (req, res) => {
  const filter = parseFilter(req.body)
  const key = buildCacheKey('cat', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key)
  if (cached) { res.json(cached); return }
  const txs = cleanTransactions(transactions, filter)
  const result = aggregateCategoryBreakdown(txs)
  cache.set(key, result)
  res.json(result)
})

app.post('/api/cash-flow', (req, res) => {
  const filter = parseFilter(req.body)
  const key = buildCacheKey('cf', filter as unknown as Record<string, unknown>)
  const cached = cache.get(key)
  if (cached) { res.json(cached); return }
  const txs = cleanTransactions(transactions, filter)
  const result = aggregateCashFlow(txs)
  cache.set(key, result)
  res.json(result)
})

app.post('/api/abnormal-samples', (req, res) => {
  const filter = parseFilter(req.body)
  const abnFilter = { ...filter, excludeAbnormal: false, excludedTxIds: [] as string[] }
  const key = buildCacheKey('abn', abnFilter as unknown as Record<string, unknown>)
  const cached = cache.get(key)
  if (cached) { res.json(cached); return }
  const txs = cleanTransactions(transactions, abnFilter)
  const result = detectAbnormal(txs)
  cache.set(key, result)
  res.json(result)
})

app.get('/api/subscriptions', (_req, res) => {
  res.json(subscriptions)
})

app.patch('/api/subscriptions/:id', (req, res) => {
  const sub = subscriptions.find(s => s.id === req.params.id)
  if (sub) sub.isHandled = !sub.isHandled
  res.json(sub)
})

app.get('/api/rules', (_req, res) => {
  res.json(rules)
})

app.post('/api/rules', (req, res) => {
  const rule = req.body as CategoryRule
  rules.push(rule)
  refreshUpdateTime()
  res.json(rule)
})

app.put('/api/rules/:id', (req, res) => {
  const idx = rules.findIndex(r => r.id === req.params.id)
  if (idx >= 0) { rules[idx] = req.body as CategoryRule; refreshUpdateTime() }
  res.json(rules[idx])
})

app.delete('/api/rules/:id', (req, res) => {
  const idx = rules.findIndex(r => r.id === req.params.id)
  if (idx >= 0) { rules.splice(idx, 1); refreshUpdateTime() }
  res.json({ ok: true })
})

app.get('/api/accounts', (_req, res) => {
  res.json(accounts)
})

const PORT = 3210
app.listen(PORT, () => {
  console.log(`[ClickHouse+Redis Mock API] running at http://localhost:${PORT}`)
})
