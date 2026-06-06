import type { DailySalesData, HourlySalesData, WeatherType } from '@/types/data'
import { STORES, HOLIDAYS_2025, CAMPAIGNS, formatDate, addDays } from './seedData'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function generateWeather(date: string, random: () => number): { type: WeatherType; temp: number } {
  const month = new Date(date).getMonth()
  const r = random()
  
  if (month >= 5 && month <= 7) {
    if (r < 0.1) return { type: 'hot', temp: 35 + random() * 5 }
    if (r < 0.5) return { type: 'sunny', temp: 28 + random() * 6 }
    if (r < 0.8) return { type: 'cloudy', temp: 25 + random() * 5 }
    if (r < 0.95) return { type: 'rainy', temp: 22 + random() * 4 }
    return { type: 'stormy', temp: 20 + random() * 3 }
  } else if (month >= 10 || month <= 1) {
    if (r < 0.05) return { type: 'snowy', temp: -5 + random() * 5 }
    if (r < 0.15) return { type: 'cold', temp: -2 + random() * 5 }
    if (r < 0.5) return { type: 'sunny', temp: 3 + random() * 8 }
    return { type: 'cloudy', temp: 0 + random() * 6 }
  } else {
    if (r < 0.45) return { type: 'sunny', temp: 15 + random() * 10 }
    if (r < 0.8) return { type: 'cloudy', temp: 12 + random() * 8 }
    if (r < 0.95) return { type: 'rainy', temp: 10 + random() * 6 }
    return { type: 'stormy', temp: 8 + random() * 4 }
  }
}

function generateHourlyData(baseSales: number, weekday: number, weatherType: WeatherType, random: () => number): HourlySalesData[] {
  const hourlyData: HourlySalesData[] = []
  
  let weatherFactor = 1
  if (weatherType === 'rainy' || weatherType === 'stormy') weatherFactor = 0.75
  if (weatherType === 'snowy' || weatherType === 'cold') weatherFactor = 0.8
  if (weatherType === 'hot') weatherFactor = 1.15
  if (weatherType === 'sunny') weatherFactor = 1.05
  
  const isWeekend = weekday === 0 || weekday === 6
  
  for (let hour = 7; hour <= 22; hour++) {
    let hourFactor = 0.2
    
    if (hour >= 7 && hour <= 9) hourFactor = isWeekend ? 0.6 : 1.2
    if (hour >= 11 && hour <= 13) hourFactor = isWeekend ? 1.0 : 1.1
    if (hour >= 14 && hour <= 16) hourFactor = isWeekend ? 1.1 : 0.8
    if (hour >= 17 && hour <= 19) hourFactor = isWeekend ? 1.2 : 0.9
    if (hour >= 20 && hour <= 22) hourFactor = isWeekend ? 0.9 : 0.5
    
    const variance = 0.85 + random() * 0.3
    const orders = Math.round(baseSales * hourFactor * weatherFactor * variance * 0.12)
    const sales = Math.round(orders * (35 + random() * 15))
    
    hourlyData.push({
      hour,
      weekday,
      orderCount: orders,
      salesAmount: sales,
    })
  }
  
  return hourlyData
}

export function generateMockData(startDate: string, endDate: string): DailySalesData[] {
  const data: DailySalesData[] = []
  let seed = 42
  const random = seededRandom(seed)
  
  const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset)
    const dateObj = new Date(currentDate)
    const weekday = dateObj.getDay()
    const isWeekend = weekday === 0 || weekday === 6
    const holiday = HOLIDAYS_2025.find(h => h.date === currentDate)
    
    const activeCampaign = CAMPAIGNS.find(c => 
      currentDate >= c.startDate && currentDate <= c.endDate
    )
    
    for (const store of STORES) {
      seed++
      const storeRandom = seededRandom(seed)
      
      let basePerformance = 8000 + storeRandom() * 4000
      if (store.area > 120) basePerformance *= 1.3
      if (store.district === '朝阳区') basePerformance *= 1.15
      
      let dayFactor = isWeekend ? 1.2 : 1.0
      if (holiday) dayFactor = 1.4
      
      const weather = generateWeather(currentDate, storeRandom)
      let weatherFactor = 1
      if (weather.type === 'sunny') weatherFactor = 1.05
      if (weather.type === 'cloudy') weatherFactor = 1.0
      if (weather.type === 'rainy') weatherFactor = 0.8
      if (weather.type === 'stormy') weatherFactor = 0.55
      if (weather.type === 'snowy') weatherFactor = 0.6
      if (weather.type === 'hot') weatherFactor = 1.15
      if (weather.type === 'cold') weatherFactor = 0.75
      
      let campaignFactor = 1
      let couponUsage = 0
      let couponRedemption = 0
      if (activeCampaign) {
        campaignFactor = 1.2 + storeRandom() * 0.25
        couponUsage = Math.round(80 + storeRandom() * 120)
        couponRedemption = Math.round(couponUsage * (0.55 + storeRandom() * 0.25))
      }
      
      const dailyVariance = 0.85 + storeRandom() * 0.3
      const baseSales = basePerformance * dayFactor * weatherFactor * campaignFactor * dailyVariance
      
      const orderCount = Math.round(baseSales / (38 + storeRandom() * 12))
      const salesAmount = Math.round(baseSales)
      const avgOrderValue = Math.round((salesAmount / orderCount) * 100) / 100
      
      const baseLossRate = 0.02 + storeRandom() * 0.025
      const lossVariance = weather.type === 'hot' ? 1.5 : weather.type === 'cold' ? 0.7 : 1
      const inventoryLossRate = Math.min(0.08, baseLossRate * lossVariance * (0.8 + storeRandom() * 0.4))
      const inventoryLoss = Math.round(salesAmount * inventoryLossRate)
      
      const hourlyData = generateHourlyData(
        basePerformance / 10,
        weekday,
        weather.type,
        storeRandom
      )
      
      data.push({
        storeId: store.id,
        storeName: store.name,
        date: currentDate,
        salesAmount,
        orderCount,
        avgOrderValue,
        couponUsage,
        couponRedemption,
        inventoryLoss,
        inventoryLossRate: Math.round(inventoryLossRate * 10000) / 10000,
        weatherType: weather.type,
        temperature: Math.round(weather.temp * 10) / 10,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        campaignId: activeCampaign?.id,
        hourlyData,
      })
    }
  }
  
  return data
}

export function generateAllData(): DailySalesData[] {
  return generateMockData('2025-03-01', '2025-07-31')
}
