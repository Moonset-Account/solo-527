export const WEATHER_OPTIONS = [
  { label: '晴天', value: 'sunny' },
  { label: '雨天', value: 'rainy' },
  { label: '雪天', value: 'snowy' },
  { label: '雾天', value: 'foggy' },
  { label: '高温', value: 'hot' },
  { label: '大风', value: 'windy' }
]

export const WEATHER_CATEGORY_MAP: Record<string, string> = {
  sunny: 'favorable',
  rainy: 'adverse',
  snowy: 'adverse',
  foggy: 'adverse',
  hot: 'extreme',
  windy: 'adverse'
}

export const WEATHER_CATEGORY_LABELS: Record<string, string> = {
  favorable: '晴好',
  adverse: '恶劣',
  extreme: '极端'
}

export const TIME_PERIOD_OPTIONS = [
  { label: '早餐时段(6:00-9:00)', value: 'breakfast' },
  { label: '午餐时段(11:00-13:00)', value: 'lunch' },
  { label: '下午茶(14:00-16:00)', value: 'afternoon' },
  { label: '晚餐时段(17:00-20:00)', value: 'dinner' },
  { label: '夜宵时段(21:00-23:00)', value: 'night' },
  { label: '其他时段', value: 'other' }
]

export const TIMEOUT_REASONS = [
  '商户备餐慢',
  '骑手到店晚',
  '订单爆单',
  '天气影响',
  '出餐口拥堵',
  '餐品制作复杂',
  '商户忘单',
  '骑手等餐人多',
  '系统派单延迟',
  '其他原因'
]

export const BUSINESS_DISTRICTS = [
  '中关村商圈',
  '国贸商圈',
  '望京商圈',
  '三里屯商圈',
  '西单商圈',
  '王府井商圈'
]

export const THRESHOLDS = {
  PREP_TIMEOUT: 15,
  WAIT_TIMEOUT: 10,
  TOTAL_TIMEOUT: 25
}

export const COLORS = {
  PRIMARY: '#165DFF',
  SUCCESS: '#00B42A',
  WARNING: '#FF7D00',
  DANGER: '#F53F3F',
  INFO: '#86909C',
  BG_LIGHT: '#F2F3F5',
  TEXT_PRIMARY: '#1D2129',
  TEXT_SECONDARY: '#4E5969',
  TEXT_TERTIARY: '#86909C'
}

export const STORAGE_KEYS = {
  RECTIFICATIONS: 'merchant_rectifications',
  FILTER_PREFERENCES: 'filter_preferences'
}
