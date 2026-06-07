import { NextRequest, NextResponse } from 'next/server'
import { getWaybillWithDetails, getDefaultPermission } from '@/lib/services/dataService'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const waybillId = searchParams.get('waybillId')
  const role = (searchParams.get('role') || 'viewer') as any
  const permission = getDefaultPermission(role)

  if (!waybillId) {
    return NextResponse.json({ error: 'waybillId is required' }, { status: 400 })
  }

  const data = await getWaybillWithDetails(waybillId)

  if (!data) {
    return NextResponse.json({ error: 'Waybill not found' }, { status: 404 })
  }

  if (!permission.canViewSensitive) {
    const sanitized = {
      waybill: {
        id: data.waybill.id,
        status: data.waybill.status,
        priority: data.waybill.priority,
        originStationId: data.waybill.originStationId,
        destStationId: data.waybill.destStationId,
        vehicleId: data.waybill.vehicleId,
      },
      vehicle: data.vehicle ? {
        id: data.vehicle.id,
        type: data.vehicle.type,
        status: data.vehicle.status,
      } : null,
      originStation: data.originStation,
      destStation: data.destStation,
      delays: data.delays.map(d => ({
        stationId: d.stationId,
        durationMinutes: d.durationMinutes,
        isDelayed: d.isDelayed,
        delayCategory: d.delayCategory,
        isOvernight: d.isOvernight,
        businessDay: d.businessDay,
        attributedToTeam: d.attributedToTeam,
      })),
      scanSequence: data.scanSequence.map(s => ({
        station: s.station,
        weather: s.weather,
        durationToNext: s.durationToNext,
        scan: {
          scanType: s.scan.scanType,
          timestamp: s.scan.timestamp,
        },
      })),
    }
    return NextResponse.json({ data: sanitized, permission })
  }

  return NextResponse.json({ data, permission })
}
