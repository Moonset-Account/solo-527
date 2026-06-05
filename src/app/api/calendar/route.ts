import { NextRequest } from 'next/server'
import { BookingService } from '@/lib/services/bookingService'
import { successResponse, handleApiError } from '@/lib/api/response'
import { requireStaff, getSearchParams } from '@/lib/api/handler'

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    const params = await getSearchParams(request)
    
    const startDate = params.start_date || new Date().toISOString().split('T')[0]
    const endDate = params.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const bookingService = new BookingService()
    const data = await bookingService.getCalendarBookings(startDate, endDate)
    
    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}
