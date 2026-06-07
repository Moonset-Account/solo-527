import type { CaliberConfig } from '@/types'

export const defaultCaliber: CaliberConfig = {
  amountAbnormalThreshold: 2.0,
  frequencyAbnormalThreshold: 3,
  merchantWhitelist: ['公司财务', '房东', '自来水公司', '电力公司', '物业公司'],
  dateRange: { start: '2025-01', end: '2025-06' },
}
