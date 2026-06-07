export interface Transaction {
  id: string
  date: string
  amount: number
  category: string
  subCategory: string
  merchant: string
  account: string
  member: string
  type: 'income' | 'expense' | 'subscription' | 'credit_card'
  isAbnormal: boolean
  abnormalType?: 'amount' | 'frequency' | 'merchant'
  isHidden: boolean
}

export interface BudgetItem {
  category: string
  budgetAmount: number
  spentAmount: number
  period: string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  nextBillDate: string
  account: string
  category: string
  isHandled: boolean
}

export interface CategoryRule {
  id: string
  keyword: string
  category: string
  subCategory: string
  scope: 'shared' | 'personal'
  priority: number
  memberId: string
}

export interface Account {
  id: string
  name: string
  type: string
  owner: string
  isHidden: boolean
}

export interface Member {
  id: string
  name: string
  role: 'admin' | 'member' | 'personal'
}

export interface FilterState {
  accounts: string[]
  categories: string[]
  members: string[]
  months: string[]
  merchants: string[]
  excludeAbnormal: boolean
  hiddenAccounts: string[]
  excludedTxIds: string[]
}

export interface CashFlowPoint {
  month: string
  income: number
  expense: number
  net: number
}

export interface CategoryBreakdownItem {
  category: string
  amount: number
  percentage: number
  subCategories: { name: string; amount: number }[]
}

export interface CaliberConfig {
  amountAbnormalThreshold: number
  frequencyAbnormalThreshold: number
  merchantWhitelist: string[]
  dateRange: { start: string; end: string }
}

export const SUB_CATEGORIES: Record<string, string[]> = {
  '收入': ['工资', '奖金', '投资收益', '兼职'],
  '固定支出': ['房租/房贷', '水电燃气', '物业费', '保险'],
  '订阅': ['流媒体', '音乐', '云存储', '健身房', '软件'],
  '购物': ['服装', '日用品', '电子产品', '食品饮料'],
  '旅行': ['机票', '酒店', '景点门票', '旅行餐饮'],
  '信用卡': ['还款', '分期'],
}

export const ACCOUNTS = ['工资卡', '储蓄卡', '信用卡A', '信用卡B', '支付宝'] as const
export const MEMBERS = ['爸爸', '妈妈', '孩子'] as const
