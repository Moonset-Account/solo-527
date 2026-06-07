import { NextRequest, NextResponse } from 'next/server'
import { getExceptions, getDefaultPermission } from '@/lib/services/dataService'
import type { FilterParams } from '@/lib/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const params: FilterParams = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    stationIds: searchParams.get('stationIds')?.split(',').filter(Boolean) || undefined,
    severityLevels: searchParams.get('severityLevels')?.split(',').filter(Boolean) || undefined,
  }

  const role = (searchParams.get('role') || 'viewer') as any
  const permission = getDefaultPermission(role)

  const data = await getExceptions(params, permission)

  return NextResponse.json({ data, permission })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { params, role = 'viewer' } = body
  
  const permission = getDefaultPermission(role as any)
  const data = await getExceptions(params, permission)

  return NextResponse.json({ data, permission })
}
