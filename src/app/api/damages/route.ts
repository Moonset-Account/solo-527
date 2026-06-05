// @ts-nocheck
import { NextRequest } from 'next/server'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { getSearchParams, validateRequest, requireAuth, insertAuditLog } from '@/lib/api/handler'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const params = await getSearchParams(request)
    
    let query = supabase
      .from('equipment_damages')
      .select(`
        *,
        equipment:equipment(id, name, sku, status),
        bookings:bookings(id, booking_no, clients:clients(name)),
        reporter:profiles(id, full_name, role)
      `)
      .order('created_at', { ascending: false })
    
    if (params.equipment_id) {
      query = query.eq('equipment_id', params.equipment_id)
    }
    if (params.booking_id) {
      query = query.eq('booking_id', params.booking_id)
    }
    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.severity) {
      query = query.eq('severity', params.severity)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Get damages error:', error)
      return errorResponse('获取损坏记录失败', 500)
    }
    
    return successResponse(data || [])
  } catch (error) {
    console.error('Get damages error:', error)
    return errorResponse('获取损坏记录失败', 500)
  }
}

const damageSchema = z.object({
  equipment_id: z.string().min(1),
  booking_id: z.string().optional(),
  responsible_party: z.string().min(1),
  severity: z.enum(['minor', 'moderate', 'severe', 'total']),
  description: z.string().min(1),
  repair_cost: z.number().min(0).optional(),
  images: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const supabase = createClient()
    
    try {
      const body = await validateRequest(request, damageSchema)
      
      const { data: damage, error: damageError }: any = await supabase
        .from('equipment_damages')
        .insert({
          equipment_id: body.equipment_id,
          booking_id: body.booking_id || null,
          reporter_id: userId,
          responsible_party: body.responsible_party,
          severity: body.severity,
          description: body.description,
          repair_cost: body.repair_cost || null,
          images: body.images || null,
          status: 'reported',
        })
        .select(`
          *,
          equipment:equipment(id, name, sku),
          bookings:bookings(id, booking_no, clients:clients(name)),
          reporter:profiles(id, full_name, role)
        `)
        .single()
      
      if (damageError) {
        console.error('Create damage error:', damageError)
        return errorResponse('上报损坏失败: ' + damageError.message, 500)
      }
      
      const { error: eqError } = await supabase
        .from('equipment')
        .update({ status: 'damaged' })
        .eq('id', body.equipment_id)
      
      if (eqError) {
        console.error('Update equipment status error:', eqError)
      }
      
      await insertAuditLog(userId, 'create_damage', 'equipment_damage', damage.id, null, {
        equipment_id: body.equipment_id,
        severity: body.severity,
      })
      
      return successResponse({ damage_id: damage.id, damage }, 201)
    } catch (error: any) {
      if (error.message === 'VALIDATION_ERROR') {
        return validationErrorResponse(error.validationErrors)
      }
      if (error.message === 'FORBIDDEN') {
        return errorResponse('没有权限', 403)
      }
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权', 401)
    }
    console.error('Create damage error:', error)
    return errorResponse('上报损坏失败', 500)
  }
}
