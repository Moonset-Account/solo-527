import type { Transaction, BudgetItem, Subscription, CategoryRule, Account, Member } from './types.js'
import { SUB_CATEGORIES, ACCOUNTS, MEMBERS } from './types.js'

const merchants: Record<string, string[]> = {
  '收入': ['公司财务', '投资平台', '兼职平台', '银行利息'],
  '固定支出': ['房东', '自来水公司', '电力公司', '燃气公司', '物业公司', '保险公司'],
  '订阅': ['Netflix', 'Spotify', 'iCloud', '健身房', 'Adobe', '微信读书', 'Apple Music'],
  '购物': ['淘宝', '京东', '拼多多', '盒马', '山姆会员店', '优衣库', 'ZARA', 'Apple Store'],
  '旅行': ['携程', '去哪儿', '飞猪', 'Booking', 'Airbnb'],
  '信用卡': ['银行还款', '花呗', '白条'],
}

function randomPick<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomAmount(category: string, subCategory: string): number {
  const ranges: Record<string, [number, number]> = {
    '工资': [15000, 35000], '奖金': [3000, 15000], '投资收益': [500, 8000], '兼职': [2000, 8000],
    '房租/房贷': [8000, 12000], '水电燃气': [150, 500], '物业费': [300, 600], '保险': [500, 3000],
    '流媒体': [15, 60], '音乐': [10, 30], '云存储': [6, 68], '健身房': [200, 500], '软件': [12, 200],
    '服装': [200, 3000], '日用品': [30, 300], '电子产品': [100, 8000], '食品饮料': [20, 500],
    '机票': [500, 4000], '酒店': [300, 2000], '景点门票': [50, 300], '旅行餐饮': [100, 800],
    '还款': [1000, 15000], '分期': [500, 5000],
  }
  const range = ranges[subCategory] || [100, 1000]
  return Math.round((range[0] + Math.random() * (range[1] - range[0])) * 100) / 100
}

function generateMonthDates(count: number): string[] {
  const months: string[] = []
  for (let i = 0; i < count; i++) {
    months.push(`2025-${String(6 - i).padStart(2, '0')}`)
  }
  return months
}

const allMonths = generateMonthDates(6)

function generateTransactions(): Transaction[] {
  const transactions: Transaction[] = []
  let id = 1
  for (const month of allMonths) {
    for (const category of Object.keys(SUB_CATEGORIES)) {
      const subs = SUB_CATEGORIES[category]
      for (const sub of subs) {
        const txCount = category === '收入' ? 1 : Math.floor(Math.random() * 4) + 1
        for (let i = 0; i < txCount; i++) {
          const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
          const member = randomPick(MEMBERS)
          const isIncome = category === '收入'
          const merchantList = merchants[category] || ['未知商户']
          const merchant = randomPick(merchantList)
          const amount = randomAmount(category, sub)
          const isAbnormal = !isIncome && Math.random() < 0.06
          let abnormalType: Transaction['abnormalType']
          if (isAbnormal) {
            abnormalType = randomPick(['amount', 'frequency', 'merchant'] as const)
          }
          const account = isIncome ? randomPick(['工资卡', '储蓄卡', '支付宝'] as const) : randomPick(ACCOUNTS)
          transactions.push({
            id: `tx-${String(id++).padStart(4, '0')}`,
            date: `${month}-${day}`,
            amount: isAbnormal && abnormalType === 'amount' ? amount * 3 : amount,
            category,
            subCategory: sub,
            merchant: isAbnormal && abnormalType === 'merchant' ? '未知异常商户' : merchant,
            account,
            member,
            type: category === '收入' ? 'income' : category === '订阅' ? 'subscription' : category === '信用卡' ? 'credit_card' : 'expense',
            isAbnormal: !!isAbnormal,
            abnormalType,
            isHidden: false,
          })
        }
      }
    }
  }
  return transactions
}

function generateBudgets(): BudgetItem[] {
  const budgetAmounts: Record<string, number> = { '固定支出': 15000, '订阅': 800, '购物': 5000, '旅行': 3000, '信用卡': 8000 }
  return Object.entries(budgetAmounts).map(([category, budget]) => ({
    category, budgetAmount: budget, spentAmount: Math.round(budget * (0.5 + Math.random() * 0.8)), period: '2025-06',
  }))
}

function generateSubscriptions(): Subscription[] {
  const subs = [
    { name: 'Netflix', amount: 49, category: '流媒体', account: '信用卡A' },
    { name: 'Spotify', amount: 15, category: '音乐', account: '信用卡A' },
    { name: 'iCloud 200G', amount: 21, category: '云存储', account: '信用卡A' },
    { name: '健身房月卡', amount: 399, category: '健身房', account: '工资卡' },
    { name: 'Adobe CC', amount: 158, category: '软件', account: '信用卡B' },
    { name: 'Apple Music', amount: 11, category: '音乐', account: '信用卡A' },
    { name: '微信读书', amount: 19, category: '软件', account: '支付宝' },
  ]
  return subs.map((s, i) => {
    const dayOffset = Math.floor(Math.random() * 15) + 1
    const date = new Date(2025, 5, dayOffset + 8)
    return { id: `sub-${i + 1}`, name: s.name, amount: s.amount, nextBillDate: date.toISOString().split('T')[0], account: s.account, category: s.category, isHandled: Math.random() < 0.3 }
  })
}

function generateRules(): CategoryRule[] {
  return [
    { id: 'r-01', keyword: 'Netflix', category: '订阅', subCategory: '流媒体', scope: 'shared', priority: 1, memberId: '爸爸' },
    { id: 'r-02', keyword: 'Spotify', category: '订阅', subCategory: '音乐', scope: 'shared', priority: 2, memberId: '爸爸' },
    { id: 'r-03', keyword: '携程', category: '旅行', subCategory: '机票', scope: 'shared', priority: 3, memberId: '妈妈' },
    { id: 'r-04', keyword: '盒马', category: '购物', subCategory: '食品饮料', scope: 'shared', priority: 4, memberId: '妈妈' },
    { id: 'r-05', keyword: 'Apple Store', category: '购物', subCategory: '电子产品', scope: 'personal', priority: 1, memberId: '爸爸' },
    { id: 'r-06', keyword: '优衣库', category: '购物', subCategory: '服装', scope: 'personal', priority: 2, memberId: '妈妈' },
  ]
}

function generateAccounts(): Account[] {
  return [
    { id: 'acc-1', name: '工资卡', type: 'debit', owner: '爸爸', isHidden: false },
    { id: 'acc-2', name: '储蓄卡', type: 'debit', owner: '妈妈', isHidden: false },
    { id: 'acc-3', name: '信用卡A', type: 'credit', owner: '爸爸', isHidden: false },
    { id: 'acc-4', name: '信用卡B', type: 'credit', owner: '妈妈', isHidden: false },
    { id: 'acc-5', name: '支付宝', type: 'ewallet', owner: '孩子', isHidden: false },
  ]
}

function generateMembers(): Member[] {
  return [
    { id: 'm-1', name: '爸爸', role: 'admin' },
    { id: 'm-2', name: '妈妈', role: 'member' },
    { id: 'm-3', name: '孩子', role: 'member' },
  ]
}

export const transactions = generateTransactions()
export const budgets = generateBudgets()
export const subscriptions = generateSubscriptions()
export const rules = generateRules()
export const accounts = generateAccounts()
export const members = generateMembers()
export const allMerchants = [...new Set(transactions.map(t => t.merchant))].sort()
export { allMonths }
