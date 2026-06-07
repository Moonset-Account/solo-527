import { NextResponse } from 'next/server'
import { getStations, getVehicles, getLoadingTeams } from '@/lib/services/dataService'

export async function GET() {
  const stations = await getStations()
  const vehicles = await getVehicles()
  const teams = await getLoadingTeams()

  return NextResponse.json({
    stations,
    vehicles,
    teams,
    weatherConditions: [
      { value: 'sunny', label: '晴' },
      { value: 'cloudy', label: '多云' },
      { value: 'rain', label: '雨' },
      { value: 'snow', label: '雪' },
      { value: 'fog', label: '雾' },
      { value: 'storm', label: '暴雨' },
    ],
    delayCategories: [
      { value: 'loading', label: '装卸效率' },
      { value: 'weather', label: '天气影响' },
      { value: 'vehicle', label: '车辆故障' },
      { value: 'traffic', label: '交通拥堵' },
      { value: 'other', label: '其他原因' },
    ],
    severityLevels: [
      { value: 'low', label: '低' },
      { value: 'medium', label: '中' },
      { value: 'high', label: '高' },
      { value: 'critical', label: '严重' },
    ],
  })
}
