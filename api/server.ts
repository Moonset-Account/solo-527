import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import type { FilterState, CategoryRule } from './types.js'
import { transactions as mockTransactions, budgets, subscriptions, rules, accounts, members, allMerchants, allMonths } from './mock.js'
import { cleanTransactions, detectAbnormal, aggregateCashFlow, aggregateCategoryBreakdown, computeBudgetProgress } from './clean.js'
import { checkClickHouse, isClickHouseConnected, queryTransactions, queryBudgetProgress, queryCategoryBreakdown, queryCashFlow, queryAbnormalSamples, queryFilterOptions as chQueryFilterOptions } from './clickhouse.js'
import { initRedis, isRedisConnected, cacheGet, cacheSet, cacheClear, setUpdateTimestamp, getUpdateTimestamp as redisGetTs, fallbackCacheGet, fallbackCacheSet, fallbackCacheClear, buildCacheKey } from './redis.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

let dataUpdatedAt = new Date().toISOString()

function refreshUpdateTime() {
  dataUpdatedAt = new Date().toISOString()
  cacheClear().catch(() => {})
  fallbackCacheClear()
  setUpdateTimestamp(dataUpdatedAt).catch(() => {})
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

async function getOrCreateCache<T>(key: string, compute: () => T | Promise<T>): Promise<T> {
  const redisResult = await cacheGet<T>(key)
  if (redisResult !== null) return redisResult

  const fallbackResult = fallbackCacheGet(key) as T | null
  if (fallbackResult !== null) return fallbackResult

  const data = await compute()

  cacheSet(key, data).catch(() => {})
  fallbackCacheSet(key, data)

  return data
}

app.get('/api/meta', async (_req, res) => {
  const redisTs = await redisGetTs()
  const updatedAt = redisTs || dataUpdatedAt
  res.json({
    updatedAt,
    clickhouse: isClickHouseConnected(),
    redis: isRedisConnected(),
  })
})

app.get('/api/filter-options', async (_req, res) => {
  if (isClickHouseConnected()) {
    const chOptions = await chQueryFilterOptions()
    if (chOptions) {
      res.json(chOptions)
      return
    }
  }
  res.json({
    accounts: accounts.map(a => a.name),
    categories: Object.keys({ '收入': [], '固定支出': [], '订阅': [], '购物': [], '旅行': [], '信用卡': [] }),
    members: members.map(m => m.name),
    months: allMonths,
    merchants: allMerchants,
  })
})

app.post('/api/transactions', async (req, res) => {
  const filter = parseFilter(req.body)
  const key = buildCacheKey('tx', filter as unknown as Record<string, unknown>)

  const data = await getOrCreateCache(key, async () => {
    if (isClickHouseConnected()) {
      const chResult = await queryTransactions(filter)
      if (chResult && chResult.length > 0) {
        return { data: chResult, meta: { updatedAt: dataUpdatedAt, sampleSize: chResult.length } }
      }
    }
    const result = cleanTransactions(mockTransactions, filter)
    return { data: result, meta: { updatedAt: dataUpdatedAt, sampleSize: result.length } }
  })

  res.json(data)
})

app.post('/api/budget-progress', async (req, res) => {
  const filter = parseFilter(req.body)
  const key = buildCacheKey('budget', filter as unknown as Record<string, unknown>)

  const data = await getOrCreateCache(key, async () => {
    if (isClickHouseConnected()) {
      const chResult = await queryBudgetProgress(filter)
      if (chResult && chResult.length > 0) return chResult
    }
    const txs = cleanTransactions(mockTransactions, filter)
    return computeBudgetProgress(txs, budgets)
  })

  res.json(data)
})

app.post('/api/category-breakdown', async (req, res) => {
  const filter = parseFilter(req.body)
  const key = buildCacheKey('cat', filter as unknown as Record<string, unknown>)

  const data = await getOrCreateCache(key, async () => {
    if (isClickHouseConnected()) {
      const chResult = await queryCategoryBreakdown(filter)
      if (chResult && chResult.length > 0) return chResult
    }
    const txs = cleanTransactions(mockTransactions, filter)
    return aggregateCategoryBreakdown(txs)
  })

  res.json(data)
})

app.post('/api/cash-flow', async (req, res) => {
  const filter = parseFilter(req.body)
  const key = buildCacheKey('cf', filter as unknown as Record<string, unknown>)

  const data = await getOrCreateCache(key, async () => {
    if (isClickHouseConnected()) {
      const chResult = await queryCashFlow(filter)
      if (chResult && chResult.length > 0) return chResult
    }
    const txs = cleanTransactions(mockTransactions, filter)
    return aggregateCashFlow(txs)
  })

  res.json(data)
})

app.post('/api/abnormal-samples', async (req, res) => {
  const filter = parseFilter(req.body)
  const abnFilter = { ...filter, excludeAbnormal: false }
  const key = buildCacheKey('abn', abnFilter as unknown as Record<string, unknown>)

  const data = await getOrCreateCache(key, async () => {
    if (isClickHouseConnected()) {
      const chResult = await queryAbnormalSamples({
        ...abnFilter,
        excludedTxIds: abnFilter.excludedTxIds,
      })
      if (chResult && (chResult.length > 0 || filter.excludedTxIds.length > 0)) return chResult
    }
    const txs = cleanTransactions(mockTransactions, abnFilter)
    let result = detectAbnormal(txs)
    if (filter.excludedTxIds.length > 0) {
      const excludedSet = new Set(filter.excludedTxIds)
      result = result.filter(t => !excludedSet.has(t.id))
    }
    return result
  })

  res.json(data)
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

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason)
})

const PORT = Number(process.env.API_PORT) || 3210

async function start() {
  const chOk = await checkClickHouse()
  console.log(`[ClickHouse] ${chOk ? 'connected' : 'unavailable, using in-memory fallback'}`)

  const redisOk = await initRedis()
  console.log(`[Redis] ${redisOk ? 'connected' : 'unavailable, using in-process LRU fallback'}`)

  app.listen(PORT, () => {
    console.log(`[API Server] running at http://localhost:${PORT}`)
    console.log(`  ClickHouse: ${chOk ? '✓' : '✗'}  Redis: ${redisOk ? '✓' : '✗'}`)
  })
}

start().catch(console.error)
