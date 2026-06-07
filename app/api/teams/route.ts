import { NextRequest, NextResponse } from 'next/server'
import { getLoadingTeamPerformance, getDefaultPermission } from '@/lib/services/dataService'
import type { FilterParams } from '@/lib/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const params: FilterParams = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    stationIds: searchParams.get('stationIds')?.split(',').filter(Boolean) || undefined,
  }

  const role = (searchParams.get('role') || 'viewer') as any
  const permission = getDefaultPermission(role)
  
  let data = getLoadingTeamPerformance(params)

  if (!permission.canViewDetails) {
    data = data.map(t => ({
      ...t,
      totalWaybills: t.isLowSample ? -1 : t.totalWaybills,
      delayedWaybills: t.isLowSample ? -1 : t.delayedWaybills,
      averageDurationMinutes: t.isLowSample ? -1 : t.averageDurationMinutes,
    }))
  }

  return NextResponse.json({ data, permission })
}
