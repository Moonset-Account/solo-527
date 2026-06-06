import type { DailySalesData, FilterState, TimeSeriesPoint, StorePerformance, WeatherImpact, KPIData, AnomalyPoint, CampaignComparison, HourlySalesData } from '@/types/data'
import { addDays, getDaysDiff, CAMPAIGNS } from '../mock/seedData'

export function filterData(data: DailySalesData[], filters: FilterState): DailySalesData[] {
  return data.filter(item => {
    if (filters.storeIds.length > 0 && !filters.storeIds.includes(item.storeId)) {
      return false
    }
    if (item.date < filters.timeRange.start || item.date > filters.timeRange.end) {
      return false
    }
    if (filters.weatherTypes.length > 0 && !filters.weatherTypes.includes(item.weatherType)) {
      return false
    }
    if (filters.campaignId && item.campaignId !== filters.campaignId) {
      return false
    }
    return true
  })
}

export function aggregateByTimeWindow(
  data: DailySalesData[],
  timeWindow: 'day' | 'week' | 'month'
): TimeSeriesPoint[] {
  if (data.length === 0) return []

  const grouped = new Map<string, DailySalesData[]>()

  for (const item of data) {
    let key = item.date
    if (timeWindow === 'week') {
      const d = new Date(item.date)
      const dayOfWeek = d.getDay()
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - dayOfWeek)
      key = weekStart.toISOString().split('T')[0]
    } else if (timeWindow === 'month') {
      key = item.date.substring(0, 7)
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(item)
  }

  const result: TimeSeriesPoint[] = []
  
  for (const [date, items] of grouped) {
    const totalSales = items.reduce((sum, i) => sum + i.salesAmount, 0)
    const totalOrders = items.reduce((sum, i) => sum + i.orderCount, 0)
    const totalLoss = items.reduce((sum, i) => sum + i.inventoryLoss, 0)
    
    result.push({
      date,
      salesAmount: totalSales,
      orderCount: totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0,
      inventoryLossRate: totalSales > 0 ? Math.round((totalLoss / totalSales) * 10000) / 10000 : 0,
      isHoliday: items.some(i => i.isHoliday),
      campaignId: items.find(i => i.campaignId)?.campaignId,
    })
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

export function aggregateByStore(data: DailySalesData[]): StorePerformance[] {
  if (data.length === 0) return []

  const midPoint = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, midPoint)
  const secondHalf = data.slice(midPoint)

  const firstHalfByStore = new Map<string, DailySalesData[]>()
  const secondHalfByStore = new Map<string, DailySalesData[]>()

  for (const item of firstHalf) {
    if (!firstHalfByStore.has(item.storeId)) {
      firstHalfByStore.set(item.storeId, [])
    }
    firstHalfByStore.get(item.storeId)!.push(item)
  }
  
  for (const item of secondHalf) {
    if (!secondHalfByStore.has(item.storeId)) {
      secondHalfByStore.set(item.storeId, [])
    }
    secondHalfByStore.get(item.storeId)!.push(item)
  }

  const grouped = new Map<string, DailySalesData[]>()
  for (const item of data) {
    if (!grouped.has(item.storeId)) {
      grouped.set(item.storeId, [])
    }
    grouped.get(item.storeId)!.push(item)
  }

  const result: StorePerformance[] = []

  for (const [storeId, items] of grouped) {
    const totalSales = items.reduce((sum, i) => sum + i.salesAmount, 0)
    const totalOrders = items.reduce((sum, i) => sum + i.orderCount, 0)
    const totalLoss = items.reduce((sum, i) => sum + i.inventoryLoss, 0)

    const firstItems = firstHalfByStore.get(storeId) || []
    const secondItems = secondHalfByStore.get(storeId) || []
    const firstSales = firstItems.reduce((sum, i) => sum + i.salesAmount, 0)
    const secondSales = secondItems.reduce((sum, i) => sum + i.salesAmount, 0)
    const salesWoW = firstSales > 0 ? ((secondSales - firstSales) / firstSales) : 0

    const sunnySales = items.filter(i => i.weatherType === 'sunny').reduce((s, i) => s + i.salesAmount, 0)
    const rainySales = items.filter(i => i.weatherType === 'rainy' || i.weatherType === 'stormy').reduce((s, i) => s + i.salesAmount, 0)
    const weatherImpactScore = sunnySales > 0 ? ((rainySales / (items.filter(i => i.weatherType === 'rainy' || i.weatherType === 'stormy').length || 1)) 
      / (sunnySales / (items.filter(i => i.weatherType === 'sunny').length || 1))) : 1

    result.push({
      storeId,
      storeName: items[0].storeName,
      district: items[0].storeName.includes('朝阳') || items[0].storeName.includes('三里屯') || items[0].storeName.includes('望京') || items[0].storeName.includes('双井') ? '朝阳区' : 
                items[0].storeName.includes('海淀') || items[0].storeName.includes('中关村') || items[0].storeName.includes('五道口') || items[0].storeName.includes('学院路') ? '海淀区' :
                items[0].storeName.includes('西') ? '西城区' : '东城区',
      totalSales,
      avgOrderValue: totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0,
      totalOrders,
      inventoryLossRate: totalSales > 0 ? Math.round((totalLoss / totalSales) * 10000) / 10000 : 0,
      salesWoW: Math.round(salesWoW * 10000) / 10000,
      weatherImpactScore: Math.round(weatherImpactScore * 100) / 100,
      rank: 0,
    })
  }

  result.sort((a, b) => b.totalSales - a.totalSales)
  result.forEach((item, index) => {
    item.rank = index + 1
  })

  return result
}

export function aggregateByWeather(data: DailySalesData[]): WeatherImpact[] {
  if (data.length === 0) return []

  const grouped = new Map<string, DailySalesData[]>()
  for (const item of data) {
    if (!grouped.has(item.weatherType)) {
      grouped.set(item.weatherType, [])
    }
    grouped.get(item.weatherType)!.push(item)
  }

  const allAvgSales = data.reduce((s, i) => s + i.salesAmount, 0) / data.length

  const result: WeatherImpact[] = []
  for (const [type, items] of grouped) {
    const totalSales = items.reduce((s, i) => s + i.salesAmount, 0)
    const totalOrders = items.reduce((s, i) => s + i.orderCount, 0)
    
    result.push({
      weatherType: type as any,
      avgSales: Math.round(totalSales / items.length),
      avgOrders: Math.round(totalOrders / items.length),
      avgAOV: totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0,
      sampleSize: items.length,
      salesIndex: Math.round((totalSales / items.length / allAvgSales) * 100) / 100,
    })
  }

  return result.sort((a, b) => b.salesIndex - a.salesIndex)
}

export function aggregateHourlyHeatmap(data: DailySalesData[]): HourlySalesData[] {
  if (data.length === 0) return []

  const hourlyMap = new Map<string, { orders: number; sales: number; count: number }>()

  for (const item of data) {
    if (!item.hourlyData) continue
    for (const hour of item.hourlyData) {
      const key = `${hour.weekday}-${hour.hour}`
      if (!hourlyMap.has(key)) {
        hourlyMap.set(key, { orders: 0, sales: 0, count: 0 })
      }
      const entry = hourlyMap.get(key)!
      entry.orders += hour.orderCount
      entry.sales += hour.salesAmount
      entry.count += 1
    }
  }

  const result: HourlySalesData[] = []
  for (const [key, value] of hourlyMap) {
    const [weekday, hour] = key.split('-').map(Number)
    result.push({
      weekday,
      hour,
      orderCount: Math.round(value.orders / value.count),
      salesAmount: Math.round(value.sales / value.count),
    })
  }

  return result
}

export function calculateKPIs(data: DailySalesData[], prevData: DailySalesData[]): KPIData {
  const totalSales = data.reduce((s, i) => s + i.salesAmount, 0)
  const totalOrders = data.reduce((s, i) => s + i.orderCount, 0)
  const totalLoss = data.reduce((s, i) => s + i.inventoryLoss, 0)
  const totalCouponUsage = data.reduce((s, i) => s + i.couponUsage, 0)
  const totalCouponRedemption = data.reduce((s, i) => s + i.couponRedemption, 0)

  const prevSales = prevData.reduce((s, i) => s + i.salesAmount, 0)
  const prevOrders = prevData.reduce((s, i) => s + i.orderCount, 0)
  const prevLoss = prevData.reduce((s, i) => s + i.inventoryLoss, 0)
  const prevAOV = prevOrders > 0 ? prevSales / prevOrders : 0

  const currentAOV = totalOrders > 0 ? totalSales / totalOrders : 0

  return {
    totalSales,
    avgOrderValue: Math.round(currentAOV * 100) / 100,
    totalOrders,
    inventoryLossRate: totalSales > 0 ? Math.round((totalLoss / totalSales) * 10000) / 10000 : 0,
    salesWoW: prevSales > 0 ? Math.round(((totalSales - prevSales) / prevSales) * 10000) / 10000 : 0,
    aovWoW: prevAOV > 0 ? Math.round(((currentAOV - prevAOV) / prevAOV) * 10000) / 10000 : 0,
    ordersWoW: prevOrders > 0 ? Math.round(((totalOrders - prevOrders) / prevOrders) * 10000) / 10000 : 0,
    lossRateWoW: 0,
    sampleSize: data.length,
    totalCouponUsage,
    couponRedemptionRate: totalCouponUsage > 0 ? Math.round((totalCouponRedemption / totalCouponUsage) * 10000) / 10000 : 0,
  }
}

export function detectAnomalies(data: DailySalesData[]): AnomalyPoint[] {
  const anomalies: AnomalyPoint[] = []
  
  const byStore = new Map<string, DailySalesData[]>()
  for (const item of data) {
    if (!byStore.has(item.storeId)) {
      byStore.set(item.storeId, [])
    }
    byStore.get(item.storeId)!.push(item)
  }

  for (const [storeId, items] of byStore) {
    const salesValues = items.map(i => i.salesAmount).sort((a, b) => a - b)
    const q1 = salesValues[Math.floor(salesValues.length * 0.25)]
    const q3 = salesValues[Math.floor(salesValues.length * 0.75)]
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr

    const lossValues = items.map(i => i.inventoryLossRate).sort((a, b) => a - b)
    const lossQ3 = lossValues[Math.floor(lossValues.length * 0.75)]
    const lossIQR = lossQ3 - lossValues[Math.floor(lossValues.length * 0.25)]
    const lossUpperBound = lossQ3 + 1.5 * lossIQR

    for (const item of items) {
      if (item.salesAmount < lowerBound) {
        anomalies.push({
          id: `low-${storeId}-${item.date}`,
          type: 'low_sales',
          storeId,
          storeName: item.storeName,
          date: item.date,
          value: item.salesAmount,
          expected: (q1 + q3) / 2,
          deviation: Math.round(((item.salesAmount - (q1 + q3) / 2) / ((q1 + q3) / 2)) * 100) / 100,
          severity: item.salesAmount < lowerBound * 0.7 ? 'critical' : 'warning',
          description: `销售额低于预期 ${Math.abs(Math.round((((q1 + q3) / 2 - item.salesAmount) / ((q1 + q3) / 2)) * 100))}%`,
        })
      }

      if (item.inventoryLossRate > lossUpperBound) {
        anomalies.push({
          id: `loss-${storeId}-${item.date}`,
          type: 'high_loss',
          storeId,
          storeName: item.storeName,
          date: item.date,
          value: item.inventoryLossRate,
          expected: lossQ3,
          deviation: Math.round(((item.inventoryLossRate - lossQ3) / lossQ3) * 100) / 100,
          severity: item.inventoryLossRate > lossUpperBound * 1.3 ? 'critical' : 'warning',
          description: `库存损耗率高于阈值 ${Math.round(((item.inventoryLossRate - lossUpperBound) / lossUpperBound) * 100)}%`,
        })
      }

      if ((item.weatherType === 'stormy' || item.weatherType === 'snowy') && item.salesAmount < lowerBound * 0.8) {
        anomalies.push({
          id: `weather-${storeId}-${item.date}`,
          type: 'weather_abnormal',
          storeId,
          storeName: item.storeName,
          date: item.date,
          value: item.salesAmount,
          expected: (q1 + q3) / 2,
          deviation: Math.round(((item.salesAmount - (q1 + q3) / 2) / ((q1 + q3) / 2)) * 100) / 100,
          severity: 'warning',
          description: `恶劣天气影响销售`,
        })
      }
    }
  }

  return anomalies.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1 }
    return sevOrder[a.severity] - sevOrder[b.severity]
  })
}

export function getCampaignComparison(data: DailySalesData[], campaignId: string): CampaignComparison[] {
  const campaign = CAMPAIGNS.find(c => c.id === campaignId)
  if (!campaign) return []

  const beforeStart = addDays(campaign.startDate, -14)
  const beforeEnd = addDays(campaign.startDate, -1)
  const afterStart = addDays(campaign.endDate, 1)
  const afterEnd = addDays(campaign.endDate, 7)

  const beforeData = data.filter(d => d.date >= beforeStart && d.date <= beforeEnd)
  const duringData = data.filter(d => d.date >= campaign.startDate && d.date <= campaign.endDate)
  const afterData = data.filter(d => d.date >= afterStart && d.date <= afterEnd)

  const calcMetrics = (items: DailySalesData[], start: string, end: string, period: 'before' | 'during' | 'after'): CampaignComparison => {
    const days = getDaysDiff(start, end)
    const totalSales = items.reduce((s, i) => s + i.salesAmount, 0)
    const totalOrders = items.reduce((s, i) => s + i.orderCount, 0)
    const totalCouponUsage = items.reduce((s, i) => s + i.couponUsage, 0)
    const totalCouponRedemption = items.reduce((s, i) => s + i.couponRedemption, 0)

    return {
      period,
      startDate: start,
      endDate: end,
      totalSales,
      avgDailySales: days > 0 ? Math.round(totalSales / days) : 0,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0,
      couponRedemptionRate: totalCouponUsage > 0 ? Math.round((totalCouponRedemption / totalCouponUsage) * 10000) / 10000 : 0,
      salesLift: 0,
    }
  }

  const before = calcMetrics(beforeData, beforeStart, beforeEnd, 'before')
  const during = calcMetrics(duringData, campaign.startDate, campaign.endDate, 'during')
  const after = calcMetrics(afterData, afterStart, afterEnd, 'after')

  during.salesLift = before.totalSales > 0 ? Math.round(((during.totalSales - before.totalSales) / before.totalSales) * 10000) / 10000 : 0
  after.salesLift = before.totalSales > 0 ? Math.round(((after.totalSales - before.totalSales) / before.totalSales) * 10000) / 10000 : 0

  return [before, during, after]
}
