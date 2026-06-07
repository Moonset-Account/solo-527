import { createClient } from '@clickhouse/client'
import type { Transaction, BudgetItem, CashFlowPoint, CategoryBreakdownItem } from './types.js'
import dotenv from 'dotenv'

dotenv.config()

export const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'family_budget',
})

let _connected = false

export async function checkClickHouse(): Promise<boolean> {
  try {
    const rs = await clickhouse.query({ query: 'SELECT 1 AS ok', format: 'JSONEachRow' })
    await rs.json()
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

interface RawTransactionRow {
  id: string
  date: string
  amount: number
  category: string
  sub_category: string
  merchant: string
  account: string
  member: string
  type: string
  is_abnormal: number
  abnormal_type: string | null
  is_hidden: number
}

function mapTransactionRow(row: RawTransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount),
    category: row.category,
    subCategory: row.sub_category,
    merchant: row.merchant,
    account: row.account,
    member: row.member,
    type: row.type as Transaction['type'],
    isAbnormal: row.is_abnormal === 1,
    abnormalType: row.abnormal_type as Transaction['abnormalType'],
    isHidden: row.is_hidden === 1,
  }
}

interface RawBudgetRow {
  category: string
  budgetAmount: number
  spentAmount: number
  period: string
}

function mapBudgetRow(row: RawBudgetRow): BudgetItem {
  return {
    category: row.category,
    budgetAmount: Number(row.budgetAmount),
    spentAmount: Number(row.spentAmount),
    period: row.period,
  }
}

interface RawCashFlowRow {
  month: string
  income: number
  expense: number
  net: number
}

function mapCashFlowRow(row: RawCashFlowRow): CashFlowPoint {
  return {
    month: row.month,
    income: Number(row.income),
    expense: Number(row.expense),
    net: Number(row.net),
  }
}

interface RawCategoryBreakdownRow {
  category: string
  amount: number
  percentage: number
}

function mapCategoryBreakdownRow(row: RawCategoryBreakdownRow): CategoryBreakdownItem {
  return {
    category: row.category,
    amount: Number(row.amount),
    percentage: Number(row.percentage),
    subCategories: [],
  }
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

export async function queryTransactions(filter: QueryFilter): Promise<Transaction[] | null> {
  const conditions = buildConditions(filter)
  const rows = await safeQuery<RawTransactionRow>('queryTransactions', `SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY date`)
  if (!rows) return null
  return rows.map(mapTransactionRow)
}

export async function queryBudgetProgress(filter: QueryFilter): Promise<BudgetItem[] | null> {
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
  const rows = await safeQuery<RawBudgetRow>('queryBudgetProgress', sql)
  if (!rows) return null
  return rows.map(mapBudgetRow)
}

export async function queryCategoryBreakdown(filter: QueryFilter): Promise<CategoryBreakdownItem[] | null> {
  const conditions = buildConditions(filter, [`type != 'income'`])
  const sql = `
    SELECT category, SUM(amount) AS amount,
           ROUND(SUM(amount) * 100.0 / SUM(SUM(amount)) OVER (), 2) AS percentage
    FROM transactions
    WHERE ${conditions.join(' AND ')}
    GROUP BY category
    ORDER BY amount DESC
  `
  const rows = await safeQuery<RawCategoryBreakdownRow>('queryCategoryBreakdown', sql)
  if (!rows) return null
  return rows.map(mapCategoryBreakdownRow)
}

export async function queryCashFlow(filter: QueryFilter): Promise<CashFlowPoint[] | null> {
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
  const rows = await safeQuery<RawCashFlowRow>('queryCashFlow', sql)
  if (!rows) return null
  return rows.map(mapCashFlowRow)
}

export async function queryAbnormalSamples(filter: Partial<QueryFilter>): Promise<Transaction[] | null> {
  const conditions = buildConditions(filter, [`is_abnormal = 1`])
  const rows = await safeQuery<RawTransactionRow>('queryAbnormalSamples', `SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY date`)
  if (!rows) return null
  return rows.map(mapTransactionRow)
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
