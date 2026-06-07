import { NextRequest, NextResponse } from 'next/server'
import { getStationAggregates, getDefaultPermission } from '@/lib/services/dataService'
import { isLowSample } from '@/lib/utils/business'
import type { FilterParams } from '@/lib/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const params: FilterParams = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    stationIds: searchParams.get('stationIds')?.split(',').filter(Boolean) || undefined,
    vehicleIds: searchParams.get('vehicleIds')?.split(',').filter(Boolean) || undefined,
    teamIds: searchParams.get('teamIds')?.split(',').filter(Boolean) || undefined,
    delayCategories: searchParams.get('delayCategories')?.split(',').filter(Boolean) || undefined,
    minDelayMinutes: searchParams.get('minDelayMinutes') ? Number(searchParams.get('minDelayMinutes')) : undefined,
  }

  const role = (searchParams.get('role') || 'viewer') as any
  const permission = getDefaultPermission(role)
  
  let data = getStationAggregates(params)

  if (!permission.canViewDetails) {
    data = data.map(s => ({
      ...s,
      totalWaybills: isLowSample(s.totalWaybills) ? -1 : s.totalWaybills,
      delayedWaybills: isLowSample(s.totalWaybills) ? -1 : s.delayedWaybills,
    }))
  }

  return NextResponse.json({ data, permission })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { params, role = 'viewer' } = body
  
  const permission = getDefaultPermission(role as any)
  let data = getStationAggregates(params)

  if (!permission.canViewDetails) {
    data = data.map(s => ({
      ...s,
      totalWaybills: isLowSample(s.totalWaybills) ? -1 : s.totalWaybills,
      delayedWaybills: isLowSample(s.totalWaybills) ? -1 : s.delayedWaybills,
    }))
  }

  return NextResponse.json({ data, permission })
}
