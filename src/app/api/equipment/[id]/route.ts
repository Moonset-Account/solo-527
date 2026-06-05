import { NextRequest } from 'next/server'
import { EquipmentService } from '@/lib/services/equipmentService'
import { successResponse, handleApiError, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { requireStaff, validateRequest, getCurrentUserId } from '@/lib/api/handler'
import { z } from 'zod'

const updateEquipmentSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  hourly_rate: z.number().min(0).optional(),
  daily_rate: z.number().min(0).optional().nullable(),
  purchase_price: z.number().min(0).optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  serial_number: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['available', 'rented', 'maintenance', 'damaged', 'lost']).optional(),
  images: z.array(z.string()).optional(),
})

const pickupReturnSchema = z.object({
  booking_equipment_id: z.string().uuid(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const equipmentService = new EquipmentService()
    
    try {
      const data = await equipmentService.getEquipmentById(params.id)
      return successResponse(data)
    } catch (error) {
      return notFoundResponse('Equipment')
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
      const body = await validateRequest(request, updateEquipmentSchema)
      const equipmentService = new EquipmentService()
      const data = await equipmentService.updateEquipment(params.id, body)
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
