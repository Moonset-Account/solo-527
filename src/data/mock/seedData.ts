import type { Store, Category, Campaign, WeatherType } from '@/types/data'

export const STORES: Store[] = [
  { id: 'S001', name: '国贸中心店', district: '朝阳区', area: 120, openDate: '2022-03-15' },
  { id: 'S002', name: '中关村旗舰店', district: '海淀区', area: 180, openDate: '2021-09-01' },
  { id: 'S003', name: '西单大悦城店', district: '西城区', area: 95, openDate: '2022-06-20' },
  { id: 'S004', name: '三里屯太古里店', district: '朝阳区', area: 150, openDate: '2021-11-10' },
  { id: 'S005', name: '望京SOHO店', district: '朝阳区', area: 110, openDate: '2023-01-15' },
  { id: 'S006', name: '金融街店', district: '西城区', area: 85, openDate: '2022-08-05' },
  { id: 'S007', name: '五道口店', district: '海淀区', area: 75, openDate: '2023-03-20' },
  { id: 'S008', name: '朝阳大悦城店', district: '朝阳区', area: 130, openDate: '2022-02-14' },
  { id: 'S009', name: '东单店', district: '东城区', area: 100, openDate: '2021-12-01' },
  { id: 'S010', name: '双井店', district: '朝阳区', area: 90, openDate: '2023-05-10' },
  { id: 'S011', name: '学院路店', district: '海淀区', area: 70, openDate: '2022-11-15' },
  { id: 'S012', name: '崇文门店', district: '东城区', area: 105, openDate: '2022-04-22' },
]

export const CATEGORIES: Category[] = [
  { id: 'C001', name: '意式咖啡' },
  { id: 'C002', name: '手冲咖啡' },
  { id: 'C003', name: '特调饮品' },
  { id: 'C004', name: '轻食甜点' },
  { id: 'C005', name: '周边商品' },
]

export const WEATHER_TYPES: { type: WeatherType; label: string; icon: string }[] = [
  { type: 'sunny', label: '晴天', icon: '☀️' },
  { type: 'cloudy', label: '多云', icon: '⛅' },
  { type: 'rainy', label: '雨天', icon: '🌧️' },
  { type: 'stormy', label: '暴雨', icon: '⛈️' },
  { type: 'snowy', label: '雪天', icon: '❄️' },
  { type: 'hot', label: '高温', icon: '🔥' },
  { type: 'cold', label: '严寒', icon: '🥶' },
]

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'CP001',
    name: '春季新品买一送一',
    startDate: '2025-03-15',
    endDate: '2025-03-31',
    type: '新品推广',
    description: '春季特调饮品买一送一活动',
  },
  {
    id: 'CP002',
    name: '五一劳动节促销',
    startDate: '2025-04-28',
    endDate: '2025-05-05',
    type: '节日促销',
    description: '全场满50减10，优惠券限量发放',
  },
  {
    id: 'CP003',
    name: '夏季冰饮节',
    startDate: '2025-06-01',
    endDate: '2025-06-30',
    type: '季节活动',
    description: '冰系列饮品第二杯半价',
  },
  {
    id: 'CP004',
    name: '店庆回馈',
    startDate: '2025-07-15',
    endDate: '2025-07-21',
    type: '店庆活动',
    description: '品牌周年庆，全场85折',
  },
]

export const HOLIDAYS_2025: { date: string; name: string }[] = [
  { date: '2025-01-01', name: '元旦' },
  { date: '2025-01-28', name: '除夕' },
  { date: '2025-01-29', name: '春节' },
  { date: '2025-01-30', name: '春节' },
  { date: '2025-01-31', name: '春节' },
  { date: '2025-02-01', name: '春节' },
  { date: '2025-02-02', name: '春节' },
  { date: '2025-04-04', name: '清明节' },
  { date: '2025-04-05', name: '清明节' },
  { date: '2025-04-06', name: '清明节' },
  { date: '2025-05-01', name: '劳动节' },
  { date: '2025-05-02', name: '劳动节' },
  { date: '2025-05-03', name: '劳动节' },
  { date: '2025-05-04', name: '劳动节' },
  { date: '2025-05-05', name: '劳动节' },
  { date: '2025-05-31', name: '端午节' },
  { date: '2025-06-01', name: '端午节' },
  { date: '2025-06-02', name: '端午节' },
  { date: '2025-10-01', name: '国庆节' },
  { date: '2025-10-02', name: '国庆节' },
  { date: '2025-10-03', name: '国庆节' },
  { date: '2025-10-04', name: '国庆节' },
  { date: '2025-10-05', name: '国庆节' },
  { date: '2025-10-06', name: '国庆节' },
  { date: '2025-10-07', name: '国庆节' },
]

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getDaysDiff(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}
