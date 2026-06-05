import { NextRequest } from 'next/server'
import { BookingService } from '@/lib/services/bookingService'
import { successResponse, handleApiError, errorResponse } from '@/lib/api/response'
import { getSearchParams } from '@/lib/api/handler'

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)
    const bookingService = new BookingService()

    if (params.type === 'studio' && params.studio_id && params.start_time && params.end_time) {
      const available = await bookingService.checkAvailability(
        params.studio_id,
        params.start_time,
        params.end_time,
        params.exclude_booking_id
      )
      return successResponse({ available, type: 'studio' })
    }

    if (params.type === 'equipment' && params.equipment_ids && params.start_time && params.end_time) {
      const equipmentIds = params.equipment_ids.split(',')
      const conflictingIds = await bookingService.checkEquipmentAvailability(
        equipmentIds,
        params.start_time,
        params.end_time,
        params.exclude_booking_id
      )
      return successResponse({ 
        available: conflictingIds.length === 0, 
        conflicting_ids: conflictingIds,
        type: 'equipment'
      })
    }

    return errorResponse('Invalid parameters. Required: type, start_time, end_time, and either studio_id or equipment_ids', 400)
  } catch (error) {
    return handleApiError(error)
  }
}
