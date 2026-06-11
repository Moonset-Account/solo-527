import { get } from '@/utils/request'

export interface StatisticItem {
  label: string
  value: number | string
  icon: string
  color: string
  trend?: number
}

export interface DashboardData {
  statistics: StatisticItem[]
  lineChart: {
    dates: string[]
    sales: number[]
    visitors: number[]
  }
  pieChart: {
    categories: string[]
    values: number[]
  }
  barChart: {
    months: string[]
    revenue: number[]
    profit: number[]
  }
}

export function getDashboardData() {
  return get<DashboardData>('/dashboard/statistics')
}
