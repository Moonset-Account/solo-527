import { createClient } from '@clickhouse/client'
import dotenv from 'dotenv'

dotenv.config()

export const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'family_budget',
})

let _connected = false

export async function checkClickHouse(): Promise<boolean> {
  try {
    await clickhouse.ping()
    _connected = true
    return true
  } catch {
    _connected = false
    return false
  }
}

export function isClickHouseConnected(): boolean {
  return _connected
}

type QueryFilter = {
  accounts: string[]
  categories: string[]
  members: string[]
  months: string[]
  merchants: string[]
  excludeAbnormal: boolean
  hiddenAccounts: string[]
  excludedTxIds: string[]
}

function buildConditions(filter: Partial<QueryFilter>, extra: string[] = []): string[] {
  const conditions = [...extra]
  if (filter.accounts?.length) conditions.push(`account IN (${filter.accounts.map(a => `'${a}'`).join(',')})`)
  if (filter.categories?.length) conditions.push(`category IN (${filter.categories.map(c => `'${c}'`).join(',')})`)
  if (filter.members?.length) conditions.push(`member IN (${filter.members.map(m => `'${m}'`).join(',')})`)
  if (filter.months?.length) conditions.push(`toYYYYMM(date) IN (${filter.months.map(m => m.replace('-', '')).join(',')})`)
  if (filter.merchants?.length) conditions.push(`merchant IN (${filter.merchants.map(m => `'${m}'`).join(',')})`)
  if (filter.excludeAbnormal) conditions.push(`is_abnormal = 0`)
  if (filter.hiddenAccounts?.length) conditions.push(`account NOT IN (${filter.hiddenAccounts.map(a => `'${a}'`).join(',')})`)
  if (filter.excludedTxIds?.length) conditions.push(`id NOT IN (${filter.excludedTxIds.map(id => `'${id}'`).join(',')})`)
  return conditions.length > 0 ? conditions : ['1=1']
}

async function safeQuery<T>(label: string, sql: string): Promise<T[] | null> {
  if (!_connected) return null
  try {
    const resultSet = await clickhouse.query({ query: sql, format: 'JSONEachRow' })
    return await resultSet.json<T[]>()
  } catch (e) {
    console.warn(`[ClickHouse] ${label} failed:`, (e as Error).message)
    return null
  }
}

export async function queryTransactions(filter: QueryFilter): Promise<unknown[] | null> {
  const conditions = buildConditions(filter)
  return safeQuery('queryTransactions', `SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY date`)
}

export async function queryBudgetProgress(filter: QueryFilter): Promise<unknown[] | null> {
  const currentMonth = '202506'
  const conditions = buildConditions(filter, [`toYYYYMM(date) = '${currentMonth}'`, `type != 'income'`])
  const sql = `
    SELECT b.category, b.budget_amount AS budgetAmount,
           COALESCE(SUM(t.amount), 0) AS spentAmount, '${currentMonth}' AS period
    FROM budgets b
    LEFT JOIN (
      SELECT category, SUM(amount) AS amount FROM transactions
      WHERE ${conditions.join(' AND ')}
      GROUP BY category
    ) t ON b.category = t.category
    GROUP BY b.category, b.budget_amount
  `
  return safeQuery('queryBudgetProgress', sql)
}

export async function queryCategoryBreakdown(filter: QueryFilter): Promise<unknown[] | null> {
  const conditions = buildConditions(filter, [`type != 'income'`])
  const sql = `
    SELECT category, SUM(amount) AS amount,
           ROUND(SUM(amount) * 100.0 / SUM(SUM(amount)) OVER (), 2) AS percentage
    FROM transactions
    WHERE ${conditions.join(' AND ')}
    GROUP BY category
    ORDER BY amount DESC
  `
  return safeQuery('queryCategoryBreakdown', sql)
}

export async function queryCashFlow(filter: QueryFilter): Promise<unknown[] | null> {
  const conditions = buildConditions(filter)
  const sql = `
    SELECT formatDateTime(date, '%Y-%m') AS month,
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
           SUM(CASE WHEN type != 'income' THEN amount ELSE 0 END) AS expense,
           SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net
    FROM transactions
    WHERE ${conditions.join(' AND ')}
    GROUP BY month
    ORDER BY month
  `
  return safeQuery('queryCashFlow', sql)
}

export async function queryAbnormalSamples(filter: Partial<QueryFilter>): Promise<unknown[] | null> {
  const conditions = buildConditions(filter, [`is_abnormal = 1`])
  return safeQuery('queryAbnormalSamples', `SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY date`)
}

export async function queryFilterOptions(): Promise<{
  accounts: string[]
  categories: string[]
  members: string[]
  months: string[]
  merchants: string[]
} | null> {
  if (!_connected) return null
  try {
    const queries = [
      `SELECT DISTINCT account AS name FROM transactions ORDER BY name`,
      `SELECT DISTINCT category AS name FROM transactions ORDER BY name`,
      `SELECT DISTINCT member AS name FROM transactions ORDER BY name`,
      `SELECT DISTINCT formatDateTime(date, '%Y-%m') AS name FROM transactions ORDER BY name`,
      `SELECT DISTINCT merchant AS name FROM transactions ORDER BY name`,
    ]
    const results = await Promise.all(queries.map(q => safeQuery<{ name: string }>('filterOpts', q)))
    if (results.some(r => r === null)) return null
    const [acc, cat, mem, mon, mer] = results as { name: string }[][]
    return {
      accounts: acc.map(r => r.name),
      categories: cat.map(r => r.name),
      members: mem.map(r => r.name),
      months: mon.map(r => r.name),
      merchants: mer.map(r => r.name),
    }
  } catch {
    return null
  }
}
