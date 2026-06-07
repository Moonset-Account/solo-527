import type { Transaction, FilterState, CashFlowPoint, CategoryBreakdownItem, BudgetItem } from '@/types'
import { SUB_CATEGORIES } from '@/types'
import { defaultCaliber } from './caliber'

export function cleanTransactions(transactions: Transaction[], filter: FilterState): Transaction[] {
  let result = [...transactions]

  if (filter.accounts.length > 0) {
    result = result.filter(t => filter.accounts.includes(t.account))
  }
  if (filter.categories.length > 0) {
    result = result.filter(t => filter.categories.includes(t.category))
  }
  if (filter.members.length > 0) {
    result = result.filter(t => filter.members.includes(t.member))
  }
  if (filter.months.length > 0) {
    result = result.filter(t => {
      const month = t.date.substring(0, 7)
      return filter.months.includes(month)
    })
  }
  if (filter.merchants.length > 0) {
    result = result.filter(t => filter.merchants.includes(t.merchant))
  }

  if (filter.excludeAbnormal) {
    result = result.filter(t => !t.isAbnormal)
  }

  result = result.filter(t => !filter.hiddenAccounts.includes(t.account))
  result = result.filter(t => !t.isHidden)

  return result
}

export function detectAbnormal(transactions: Transaction[]): Transaction[] {
  const categoryMeans: Record<string, number> = {}
  const categoryCounts: Record<string, number> = {}

  const expenseTxs = transactions.filter(t => t.type !== 'income')

  for (const cat of Object.keys(SUB_CATEGORIES)) {
    const catTxs = expenseTxs.filter(t => t.category === cat)
    if (catTxs.length === 0) continue
    categoryMeans[cat] = catTxs.reduce((s, t) => s + t.amount, 0) / catTxs.length
    const merchantCounts: Record<string, number> = {}
    for (const t of catTxs) {
      merchantCounts[t.merchant] = (merchantCounts[t.merchant] || 0) + 1
    }
    categoryCounts[cat] = Math.max(...Object.values(merchantCounts))
  }

  return expenseTxs.filter(t => {
    if (defaultCaliber.merchantWhitelist.includes(t.merchant)) return false
    const mean = categoryMeans[t.category] || 0
    if (mean > 0 && t.amount > mean * defaultCaliber.amountAbnormalThreshold) {
      return true
    }
    return t.isAbnormal
  })
}

export function aggregateCashFlow(transactions: Transaction[]): CashFlowPoint[] {
  const monthMap: Record<string, CashFlowPoint> = {}

  for (const t of transactions) {
    const month = t.date.substring(0, 7)
    if (!monthMap[month]) {
      monthMap[month] = { month, income: 0, expense: 0, net: 0 }
    }
    if (t.type === 'income') {
      monthMap[month].income += t.amount
    } else {
      monthMap[month].expense += t.amount
    }
  }

  return Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({ ...m, net: m.income - m.expense }))
}

export function aggregateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownItem[] {
  const expenseTxs = transactions.filter(t => t.type !== 'income')
  const total = expenseTxs.reduce((s, t) => s + t.amount, 0)

  const categoryMap: Record<string, { amount: number; subs: Record<string, number> }> = {}

  for (const t of expenseTxs) {
    if (!categoryMap[t.category]) {
      categoryMap[t.category] = { amount: 0, subs: {} }
    }
    categoryMap[t.category].amount += t.amount
    categoryMap[t.category].subs[t.subCategory] = (categoryMap[t.category].subs[t.subCategory] || 0) + t.amount
  }

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      amount: Math.round(data.amount * 100) / 100,
      percentage: total > 0 ? Math.round((data.amount / total) * 10000) / 100 : 0,
      subCategories: Object.entries(data.subs)
        .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function computeBudgetProgress(transactions: Transaction[], budgets: BudgetItem[]): BudgetItem[] {
  const currentMonth = '2025-06'
  const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth) && t.type !== 'income')

  const catSpent: Record<string, number> = {}
  for (const t of monthTxs) {
    catSpent[t.category] = (catSpent[t.category] || 0) + t.amount
  }

  return budgets.map(b => ({
    ...b,
    spentAmount: Math.round((catSpent[b.category] || 0) * 100) / 100,
    period: currentMonth,
  }))
}
