import { NextRequest } from 'next/server'
import { z } from 'zod'
import { EquipmentService } from '@/lib/services/equipmentService'
import { successResponse, handleApiError, validationErrorResponse } from '@/lib/api/response'
import { getSearchParams, validateRequest, getCurrentUserId } from '@/lib/api/handler'

const damageReportSchema = z.object({
  equipment_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  responsible_party: z.string().min(1),
  severity: z.enum(['minor', 'moderate', 'severe', 'total']),
  description: z.string().min(1),
  repair_cost: z.number().min(0).optional(),
  images: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)
    const equipmentService = new EquipmentService()

    const filters: any = {}
    if (params.equipment_id) filters.equipment_id = params.equipment_id
    if (params.booking_id) filters.booking_id = params.booking_id
    if (params.status) filters.status = params.status

    const data = await equipmentService.getDamageReports(filters)
    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return handleApiError(new Error('UNAUTHORIZED'))
    }
    
    try {
      const body = await validateRequest(request, damageReportSchema)
      const equipmentService = new EquipmentService()
      const data = await equipmentService.reportDamage(body, userId)
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
