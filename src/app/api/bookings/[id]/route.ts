import { NextRequest } from 'next/server'
import { BookingService } from '@/lib/services/bookingService'
import { successResponse, handleApiError, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { requireStaff, validateRequest } from '@/lib/api/handler'
import { z } from 'zod'

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

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff()
    const bookingService = new BookingService()
    
    try {
      const data = await bookingService.getBookingById(params.id)
      return successResponse(data)
    } catch (error) {
      return notFoundResponse('Booking')
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff()
    
    try {
      const body = await validateRequest(request, updateBookingSchema)
      const bookingService = new BookingService()
      const data = await bookingService.updateBooking(params.id, body)
      return successResponse(data)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff()
    
    try {
      const body = await request.json().catch(() => ({}))
      const result = cancelBookingSchema.safeParse(body)
      const reason = result.success ? result.data.reason : undefined
      
      const bookingService = new BookingService()
      await bookingService.cancelBooking(params.id, reason)
      return successResponse({ message: 'Booking cancelled successfully' })
    } catch (error) {
      return notFoundResponse('Booking')
    }
  } catch (error) {
    return handleApiError(error)
  }
}
