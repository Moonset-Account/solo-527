import type {
  TransferStation,
  Vehicle,
  LoadingTeam,
  WeatherRecord,
  Waybill,
  ScanRecord,
  DelayRecord,
  ExceptionRecord,
} from '../types'

export const stations: TransferStation[] = [
  {
    id: 'stn_001',
    name: '北京物流中心',
    code: 'BJHU',
    location: { lng: 116.4074, lat: 39.9042 },
    province: '北京',
    city: '北京市',
    level: 'hub',
  },
  {
    id: 'stn_002',
    name: '上海物流中心',
    code: 'SHHU',
    location: { lng: 121.4737, lat: 31.2304 },
    province: '上海',
    city: '上海市',
    level: 'hub',
  },
  {
    id: 'stn_003',
    name: '广州转运中心',
    code: 'GZRC',
    location: { lng: 113.2644, lat: 23.1291 },
    province: '广东',
    city: '广州市',
    level: 'regional',
  },
  {
    id: 'stn_004',
    name: '深圳物流中心',
    code: 'SZHU',
    location: { lng: 114.0579, lat: 22.5431 },
    province: '广东',
    city: '深圳市',
    level: 'hub',
  },
  {
    id: 'stn_005',
    name: '成都转运中心',
    code: 'CDRC',
    location: { lng: 104.0668, lat: 30.5728 },
    province: '四川',
    city: '成都市',
    level: 'regional',
  },
  {
    id: 'stn_006',
    name: '武汉物流中心',
    code: 'WHHU',
    location: { lng: 114.3055, lat: 30.5931 },
    province: '湖北',
    city: '武汉市',
    level: 'regional',
  },
  {
    id: 'stn_007',
    name: '西安转运中心',
    code: 'XARC',
    location: { lng: 108.9398, lat: 34.3416 },
    province: '陕西',
    city: '西安市',
    level: 'local',
  },
  {
    id: 'stn_008',
    name: '杭州物流中心',
    code: 'HZRC',
    location: { lng: 120.1551, lat: 30.2741 },
    province: '浙江',
    city: '杭州市',
    level: 'regional',
  },
  {
    id: 'stn_009',
    name: '南京转运中心',
    code: 'NJRC',
    location: { lng: 118.7969, lat: 32.0603 },
    province: '江苏',
    city: '南京市',
    level: 'local',
  },
  {
    id: 'stn_010',
    name: '重庆物流中心',
    code: 'CQHU',
    location: { lng: 106.5516, lat: 29.5630 },
    province: '重庆',
    city: '重庆市',
    level: 'regional',
  },
]

export const vehicles: Vehicle[] = [
  { id: 'veh_001', plateNumber: '京A12345', type: '大型货车', capacity: 20000, status: 'active', teamId: 'team_001' },
  { id: 'veh_002', plateNumber: '京B67890', type: '大型货车', capacity: 25000, status: 'active', teamId: 'team_001' },
  { id: 'veh_003', plateNumber: '沪A11111', type: '中型货车', capacity: 15000, status: 'active', teamId: 'team_002' },
  { id: 'veh_004', plateNumber: '沪B22222', type: '大型货车', capacity: 30000, status: 'maintenance', teamId: 'team_002' },
  { id: 'veh_005', plateNumber: '粤A33333', type: '大型货车', capacity: 28000, status: 'active', teamId: 'team_003' },
  { id: 'veh_006', plateNumber: '粤B44444', type: '中型货车', capacity: 12000, status: 'active', teamId: 'team_004' },
  { id: 'veh_007', plateNumber: '川A55555', type: '大型货车', capacity: 25000, status: 'idle', teamId: 'team_005' },
  { id: 'veh_008', plateNumber: '鄂A66666', type: '大型货车', capacity: 20000, status: 'active', teamId: 'team_006' },
  { id: 'veh_009', plateNumber: '浙A77777', type: '中型货车', capacity: 18000, status: 'active', teamId: 'team_008' },
  { id: 'veh_010', plateNumber: '渝A88888', type: '大型货车', capacity: 22000, status: 'active', teamId: 'team_010' },
]

export const loadingTeams: LoadingTeam[] = [
  { id: 'team_001', name: '北京一队', stationId: 'stn_001', shift: 'day', size: 15 },
  { id: 'team_002', name: '上海一队', stationId: 'stn_002', shift: 'day', size: 20 },
  { id: 'team_003', name: '广州一队', stationId: 'stn_003', shift: 'day', size: 12 },
  { id: 'team_004', name: '深圳一队', stationId: 'stn_004', shift: 'day', size: 18 },
  { id: 'team_005', name: '成都一队', stationId: 'stn_005', shift: 'night', size: 10 },
  { id: 'team_006', name: '武汉一队', stationId: 'stn_006', shift: 'all', size: 14 },
  { id: 'team_007', name: '西安一队', stationId: 'stn_007', shift: 'day', size: 8 },
  { id: 'team_008', name: '杭州一队', stationId: 'stn_008', shift: 'day', size: 16 },
  { id: 'team_009', name: '南京一队', stationId: 'stn_009', shift: 'night', size: 9 },
  { id: 'team_010', name: '重庆一队', stationId: 'stn_010', shift: 'all', size: 11 },
]

function generateWeatherRecords(): WeatherRecord[] {
  const records: WeatherRecord[] = []
  const conditions: WeatherRecord['condition'][] = ['sunny', 'cloudy', 'rain', 'snow', 'fog', 'storm']
  const now = new Date()

  stations.forEach((station, sIdx) => {
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(now.getTime() - i * 4 * 60 * 60 * 1000)
      records.push({
        id: `wth_${sIdx}_${i}`,
        stationId: station.id,
        timestamp,
        condition: conditions[Math.floor(Math.random() * 4)],
        temperature: Math.round((15 + Math.random() * 20) * 10) / 10,
        windSpeed: Math.round(Math.random() * 15 * 10) / 10,
        visibility: Math.round((5 + Math.random() * 15) * 10) / 10,
      })
    }
  })

  return records
}

export const weatherRecords = generateWeatherRecords()

function generateMockData(): {
  waybills: Waybill[]
  scanRecords: ScanRecord[]
  delayRecords: DelayRecord[]
  exceptions: ExceptionRecord[]
} {
  const waybills: Waybill[] = []
  const scanRecords: ScanRecord[] = []
  const delayRecords: DelayRecord[] = []
  const exceptions: ExceptionRecord[] = []
  const now = new Date()

  const stationPairs = [
    ['stn_001', 'stn_002'],
    ['stn_001', 'stn_006'],
    ['stn_002', 'stn_008'],
    ['stn_003', 'stn_004'],
    ['stn_004', 'stn_008'],
    ['stn_005', 'stn_010'],
    ['stn_006', 'stn_007'],
    ['stn_006', 'stn_005'],
    ['stn_008', 'stn_009'],
    ['stn_009', 'stn_002'],
    ['stn_001', 'stn_007'],
    ['stn_004', 'stn_003'],
  ]

  for (let i = 0; i < 150; i++) {
    const pair = stationPairs[i % stationPairs.length]
    const originStation = stations.find(s => s.id === pair[0])!
    const destStation = stations.find(s => s.id === pair[1])!
    const vehicle = vehicles[i % vehicles.length]
    const createdTime = new Date(now.getTime() - (i * 3 + Math.random() * 2) * 60 * 60 * 1000)
    const estimatedArrival = new Date(createdTime.getTime() + (6 + Math.random() * 10) * 60 * 60 * 1000)
    
    const isDelayed = Math.random() < 0.35
    const actualArrival = new Date(estimatedArrival.getTime() + (isDelayed ? (1 + Math.random() * 8) : (Math.random() - 0.5) * 2) * 60 * 60 * 1000)

    const waybill: Waybill = {
      id: `wb_${String(i + 1).padStart(4, '0')}`,
      waybillNumber: `SF${100000000000 + i}`,
      originStationId: pair[0],
      destStationId: pair[1],
      vehicleId: vehicle.id,
      createdTime,
      estimatedArrival,
      actualArrival: actualArrival,
      status: isDelayed ? 'delayed' : (Math.random() < 0.1 ? 'exception' : 'delivered'),
      priority: Math.random() < 0.1 ? 'vip' : (Math.random() < 0.2 ? 'urgent' : 'normal'),
    }
    waybills.push(waybill)

    const midStations = Math.random() < 0.4
    const allStops = [originStation]
    
    if (midStations) {
      const midIdx = Math.floor(Math.random() * stations.length)
      const midStation = stations[midIdx]
      if (midStation.id !== originStation.id && midStation.id !== destStation.id) {
        allStops.push(midStation)
      }
    }
    allStops.push(destStation)

    let currentTime = new Date(createdTime.getTime())
    const isOvernightRoute = Math.random() < 0.25
    const delayCategory = isDelayed ? (['loading', 'weather', 'vehicle', 'traffic', 'other'][Math.floor(Math.random() * 5)] as DelayRecord['delayCategory']) : null
    const hasVehicleBreakdown = delayCategory === 'vehicle'
    const loadingTeamForOrigin = loadingTeams.find(t => t.stationId === originStation.id) || null

    allStops.forEach((station, stopIdx) => {
      const isLastStop = stopIdx === allStops.length - 1
      const baseDuration = isLastStop ? 0 : (45 + Math.random() * 120)
      const extraDelay = isDelayed && stopIdx === 0 && !isLastStop ? (delayCategory === 'vehicle' ? 180 : delayCategory === 'weather' ? 90 : delayCategory === 'loading' ? 120 : 60) : 0
      const stayDuration = baseDuration + extraDelay

      const arrivalTime = new Date(currentTime)
      if (isOvernightRoute && stopIdx === 0) {
        arrivalTime.setHours(22 + Math.floor(Math.random() * 2))
      }
      
      const departureTime = isLastStop ? null : new Date(arrivalTime.getTime() + stayDuration * 60 * 1000)
      
      const arrivalScan: ScanRecord = {
        id: `scan_${i}_${stopIdx}_arr`,
        waybillId: waybill.id,
        vehicleId: vehicle.id,
        stationId: station.id,
        scanType: 'arrival',
        timestamp: arrivalTime,
        operatorId: `op_${Math.floor(Math.random() * 20) + 1}`,
        location: station.location,
      }
      scanRecords.push(arrivalScan)

      let departureScan: ScanRecord | null = null
      if (departureTime) {
        departureScan = {
          id: `scan_${i}_${stopIdx}_dep`,
          waybillId: waybill.id,
          vehicleId: vehicle.id,
          stationId: station.id,
          scanType: 'departure',
          timestamp: departureTime,
          operatorId: `op_${Math.floor(Math.random() * 20) + 1}`,
          location: station.location,
        }
        scanRecords.push(departureScan)
      }

      if (!isLastStop) {
        const { businessDay, isOvernight, durationMinutes } = calculateBusinessLogic(arrivalTime, departureTime!)
        const attributedToTeam = shouldAttributeToTeam(delayCategory || 'other')

        const delayRecord: DelayRecord = {
          id: `delay_${i}_${stopIdx}`,
          waybillId: waybill.id,
          stationId: station.id,
          vehicleId: vehicle.id,
          arrivalScanId: arrivalScan.id,
          departureScanId: departureScan!.id,
          arrivalTime,
          departureTime,
          businessDay,
          durationMinutes,
          isOvernight,
          isDelayed: stayDuration > 60,
          delayCategory: stayDuration > 60 ? delayCategory : null,
          loadingTeamId: stopIdx === 0 ? loadingTeamForOrigin?.id || null : null,
          attributedToTeam,
        }
        delayRecords.push(delayRecord)
      }

      if (departureTime) {
        currentTime = new Date(departureTime.getTime() + (30 + Math.random() * 60) * 60 * 1000)
      }
    })

    if (waybill.status === 'exception' || isDelayed) {
      const exceptionTypes: ExceptionRecord['type'][] = ['vehicle_breakdown', 'weather_delay', 'loading_delay', 'traffic_jam', 'package_damage', 'other']
      const severities: ExceptionRecord['severity'][] = ['low', 'medium', 'high', 'critical']
      
      const exceptionCount = hasVehicleBreakdown ? 2 : (Math.random() < 0.3 ? 1 : 0)
      for (let e = 0; e < exceptionCount; e++) {
        exceptions.push({
          id: `exc_${i}_${e}`,
          waybillId: waybill.id,
          stationId: pair[0],
          timestamp: new Date(createdTime.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000),
          type: hasVehicleBreakdown && e === 0 ? 'vehicle_breakdown' : exceptionTypes[Math.floor(Math.random() * exceptionTypes.length)],
          severity: hasVehicleBreakdown && e === 0 ? 'high' : severities[Math.floor(Math.random() * severities.length)],
          description: hasVehicleBreakdown && e === 0 
            ? '车辆发动机故障，等待救援维修' 
            : `异常情况说明 ${e + 1}`,
          handlingStatus: Math.random() < 0.7 ? 'resolved' : (Math.random() < 0.5 ? 'processing' : 'pending'),
          handlerId: Math.random() < 0.8 ? `handler_${Math.floor(Math.random() * 10) + 1}` : null,
        })
      }
    }
  }

  return { waybills, scanRecords, delayRecords, exceptions }
}

function calculateBusinessLogic(arrival: Date, departure: Date) {
  const BUSINESS_DAY_START_HOUR = 6
  
  function getBusinessDay(date: Date): string {
    const adjusted = new Date(date)
    adjusted.setHours(adjusted.getHours() - BUSINESS_DAY_START_HOUR)
    return adjusted.toISOString().split('T')[0]
  }

  const arrivalBusinessDay = getBusinessDay(arrival)
  const departureBusinessDay = getBusinessDay(departure)
  const isOvernight = arrivalBusinessDay !== departureBusinessDay
  const durationMinutes = Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60))

  return { businessDay: arrivalBusinessDay, isOvernight, durationMinutes }
}

function shouldAttributeToTeam(delayCategory: string): boolean {
  return delayCategory !== 'vehicle' && delayCategory !== 'weather'
}

export const { waybills, scanRecords, delayRecords, exceptions } = generateMockData()
