import { NextResponse } from 'next/server'
import { checkAvailability } from '@/lib/order-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studioId = searchParams.get('studioId')
  const startTime = searchParams.get('startTime')
  const endTime = searchParams.get('endTime')
  const equipmentIds = searchParams.get('equipmentIds')?.split(',') || []
  const excludeOrderId = searchParams.get('excludeOrderId') || undefined

  if (!studioId || !startTime || !endTime) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    const result = await checkAvailability(
      studioId,
      startTime,
      endTime,
      equipmentIds,
      excludeOrderId
    )
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
