import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ClientService } from '@/lib/services/clientService'
import { successResponse, handleApiError, validationErrorResponse, notFoundResponse } from '@/lib/api/response'
import { requireStaff, getSearchParams, validateRequest, getCurrentUserId } from '@/lib/api/handler'

const createClientSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

const updateClientSchema = createClientSchema.partial()

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    const params = await getSearchParams(request)
    const clientService = new ClientService()

    const filters: any = {}
    if (params.search) filters.search = params.search

    const data = await clientService.getClients(filters)
    return successResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireStaff()
    
    try {
      const body = await validateRequest(request, createClientSchema)
      const clientService = new ClientService()
      const data = await clientService.createClient(body, userId)
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
