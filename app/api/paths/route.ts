import { NextRequest, NextResponse } from 'next/server'
import { getPathAggregates, getPathDetails, getDefaultPermission } from '@/lib/services/dataService'
import type { FilterParams } from '@/lib/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const params: FilterParams = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    stationIds: searchParams.get('stationIds')?.split(',').filter(Boolean) || undefined,
    vehicleIds: searchParams.get('vehicleIds')?.split(',').filter(Boolean) || undefined,
    delayCategories: searchParams.get('delayCategories')?.split(',').filter(Boolean) || undefined,
    minDelayMinutes: searchParams.get('minDelayMinutes') ? Number(searchParams.get('minDelayMinutes')) : undefined,
  }

  const pathId = searchParams.get('pathId')
  const role = (searchParams.get('role') || 'viewer') as any
  const permission = getDefaultPermission(role)

  if (pathId) {
    const details = await getPathDetails(pathId, params)
    if (!permission.canViewDetails) {
      const sanitized = details.map((d: any) => ({
        waybill: {
          id: d.waybill.id,
          status: d.waybill.status,
          priority: d.waybill.priority,
        },
        delays: d.delays.map((delay: any) => ({
          stationId: delay.stationId,
          durationMinutes: delay.durationMinutes,
          isDelayed: delay.isDelayed,
          delayCategory: delay.delayCategory,
        })),
      }))
      return NextResponse.json({ data: sanitized, permission })
    }
    return NextResponse.json({ data: details, permission })
  }

  const paths = await getPathAggregates(params)
  return NextResponse.json({ data: paths, permission })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { params, pathId, role = 'viewer' } = body
  const permission = getDefaultPermission(role as any)

  if (pathId) {
    const details = await getPathDetails(pathId, params)
    if (!permission.canViewDetails) {
      const sanitized = details.map((d: any) => ({
        waybill: { id: d.waybill.id, status: d.waybill.status },
        delays: d.delays.map((delay: any) => ({
          stationId: delay.stationId,
          durationMinutes: delay.durationMinutes,
          isDelayed: delay.isDelayed,
        })),
      }))
      return NextResponse.json({ data: sanitized, permission })
    }
    return NextResponse.json({ data: details, permission })
  }

  const paths = await getPathAggregates(params)
  return NextResponse.json({ data: paths, permission })
}
