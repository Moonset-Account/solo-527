import { clickhouse, checkClickHouse } from './clickhouse.js'
import { transactions, budgets, subscriptions, rules, accounts, members } from './mock.js'

const DATABASE = process.env.CLICKHOUSE_DATABASE || 'family_budget'

async function createDatabase() {
  await clickhouse.command({
    query: `CREATE DATABASE IF NOT EXISTS ${DATABASE}`,
  })
  console.log(`[seed] database ${DATABASE} ensured`)
}

async function createTables() {
  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${DATABASE}.transactions (
        id String,
        date Date,
        amount Float64,
        category LowCardinality(String),
        sub_category LowCardinality(String),
        merchant String,
        account LowCardinality(String),
        member LowCardinality(String),
        type Enum8('income'=1, 'expense'=2, 'subscription'=3, 'credit_card'=4),
        is_abnormal UInt8,
        abnormal_type Nullable(String),
        is_hidden UInt8
      ) ENGINE = MergeTree()
      ORDER BY (date, category, member)
    `,
  })
  console.log('[seed] table transactions created')

  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${DATABASE}.budgets (
        category String,
        budget_amount Float64,
        spent_amount Float64,
        period String
      ) ENGINE = ReplaceMergeTree()
      ORDER BY (category, period)
    `,
  })
  console.log('[seed] table budgets created')

  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${DATABASE}.subscriptions (
        id String,
        name String,
        amount Float64,
        next_bill_date Date,
        account String,
        category String,
        is_handled UInt8
      ) ENGINE = ReplacingMergeTree()
      ORDER BY id
    `,
  })
  console.log('[seed] table subscriptions created')

  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${DATABASE}.category_rules (
        id String,
        keyword String,
        category String,
        sub_category String,
        scope Enum8('shared'=1, 'personal'=2),
        priority UInt32,
        member_id String
      ) ENGINE = ReplacingMergeTree()
      ORDER BY (scope, priority)
    `,
  })
  console.log('[seed] table category_rules created')
}

async function seedTransactions() {
  const rows = transactions.map(t => ({
    id: t.id,
    date: t.date,
    amount: t.amount,
    category: t.category,
    sub_category: t.subCategory,
    merchant: t.merchant,
    account: t.account,
    member: t.member,
    type: t.type,
    is_abnormal: t.isAbnormal ? 1 : 0,
    abnormal_type: t.abnormalType || null,
    is_hidden: t.isHidden ? 1 : 0,
  }))

  await clickhouse.insert({
    table: `${DATABASE}.transactions`,
    values: rows,
    format: 'JSONEachRow',
  })
  console.log(`[seed] ${rows.length} transactions inserted`)
}

async function seedBudgets() {
  const rows = budgets.map(b => ({
    category: b.category,
    budget_amount: b.budgetAmount,
    spent_amount: b.spentAmount,
    period: b.period,
  }))

  await clickhouse.insert({
    table: `${DATABASE}.budgets`,
    values: rows,
    format: 'JSONEachRow',
  })
  console.log(`[seed] ${rows.length} budgets inserted`)
}

async function seedSubscriptions() {
  const rows = subscriptions.map(s => ({
    id: s.id,
    name: s.name,
    amount: s.amount,
    next_bill_date: s.nextBillDate,
    account: s.account,
    category: s.category,
    is_handled: s.isHandled ? 1 : 0,
  }))

  await clickhouse.insert({
    table: `${DATABASE}.subscriptions`,
    values: rows,
    format: 'JSONEachRow',
  })
  console.log(`[seed] ${rows.length} subscriptions inserted`)
}

async function seedRules() {
  const rows = rules.map(r => ({
    id: r.id,
    keyword: r.keyword,
    category: r.category,
    sub_category: r.subCategory,
    scope: r.scope,
    priority: r.priority,
    member_id: r.memberId,
  }))

  await clickhouse.insert({
    table: `${DATABASE}.category_rules`,
    values: rows,
    format: 'JSONEachRow',
  })
  console.log(`[seed] ${rows.length} rules inserted`)
}

async function main() {
  console.log('[seed] connecting to ClickHouse...')
  const ok = await checkClickHouse()
  if (!ok) {
    console.error('[seed] ClickHouse not available, aborting')
    process.exit(1)
  }

  await createDatabase()
  await createTables()
  await seedTransactions()
  await seedBudgets()
  await seedSubscriptions()
  await seedRules()

  console.log('[seed] done!')
  process.exit(0)
}

main().catch(console.error)
