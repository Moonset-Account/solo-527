import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BookingService } from '@/lib/services/bookingService'
import { successResponse, handleApiError, validationErrorResponse } from '@/lib/api/response'
import { requireStaff, getSearchParams, validateRequest, getCurrentUserId } from '@/lib/api/handler'

const createBookingSchema = z.object({
  client_id: z.string().uuid(),
  studio_id: z.string().uuid().optional(),
  package_id: z.string().uuid().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  total_amount: z.number().min(0),
  deposit_amount: z.number().min(0),
  photographer_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  equipment_items: z.array(
    z.object({
      equipment_id: z.string().uuid(),
      quantity: z.number().int().min(1),
      unit_price: z.number().min(0),
    })
  ).optional(),
  assistant_items: z.array(
    z.object({
      assistant_id: z.string().uuid(),
      hours: z.number().min(0.5),
      unit_price: z.number().min(0),
    })
  ).optional(),
})

const updateBookingSchema = z.object({
  status: z.enum(['draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']).optional(),
  contract_status: z.enum(['draft', 'sent', 'signed', 'cancelled']).optional(),
  payment_status: z.enum(['unpaid', 'deposit_paid', 'partial_paid', 'paid', 'refunded']).optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  studio_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  deposit_amount: z.number().min(0).optional(),
  total_amount: z.number().min(0).optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    const params = await getSearchParams(request)
    const bookingService = new BookingService()

    const filters: any = {}
    if (params.status) filters.status = params.status
    if (params.studio_id) filters.studio_id = params.studio_id
    if (params.client_id) filters.client_id = params.client_id
    if (params.start_date) filters.start_date = params.start_date
    if (params.end_date) filters.end_date = params.end_date

    const data = await bookingService.getBookings(filters)
    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireStaff()
    
    try {
      const body = await validateRequest(request, createBookingSchema)
      const bookingService = new BookingService()
      const result = await bookingService.createBooking(body, userId)
      return successResponse({ booking_id: result }, 201)
    } catch (error: any) {
      if (error.message === 'VALIDATION_ERROR') {
        return validationErrorResponse(error.validationErrors)
      }
      throw error
    }
  } catch (error) {
    return handleApiError(error)
  }
}
