import { NextRequest } from 'next/server'
import { z } from 'zod'
import { EquipmentService } from '@/lib/services/equipmentService'
import { successResponse, handleApiError, validationErrorResponse, notFoundResponse } from '@/lib/api/response'
import { requireStaff, getSearchParams, validateRequest, getCurrentUserId } from '@/lib/api/handler'

const createEquipmentSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category_id: z.string().uuid().optional(),
  description: z.string().optional(),
  hourly_rate: z.number().min(0),
  daily_rate: z.number().min(0).optional(),
  purchase_price: z.number().min(0).optional(),
  purchase_date: z.string().optional(),
  serial_number: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  notes: z.string().optional(),
  images: z.array(z.string()).optional(),
})

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
    if (params.category_id) filters.category_id = params.category_id
    if (params.status) filters.status = params.status
    if (params.search) filters.search = params.search

    const data = await equipmentService.getEquipment(filters)
    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireStaff()
    
    try {
      const body = await validateRequest(request, createEquipmentSchema)
      const equipmentService = new EquipmentService()
      const data = await equipmentService.createEquipment(body)
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
