import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PaymentService } from '@/lib/services/paymentService'
import { successResponse, handleApiError, validationErrorResponse } from '@/lib/api/response'
import { requireStaff, getSearchParams, validateRequest, getCurrentUserId } from '@/lib/api/handler'

const createPaymentSchema = z.object({
  booking_id: z.string().uuid(),
  amount: z.number().min(0.01),
  payment_method: z.string().min(1),
  transaction_no: z.string().optional(),
  is_deposit: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    const params = await getSearchParams(request)
    const paymentService = new PaymentService()
    
    const data = await paymentService.getPayments(params.booking_id)
    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireStaff()
    
    try {
      const body = await validateRequest(request, createPaymentSchema)
      const paymentService = new PaymentService()
      const data = await paymentService.createPayment(body, userId)
      return successResponse(data, 201)
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
