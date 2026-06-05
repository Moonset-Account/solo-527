// @ts-nocheck
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { getSearchParams, validateRequest, requireStaff, getCurrentUserId, insertAuditLog } from '@/lib/api/handler'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const params = await getSearchParams(request)
    
    let query = supabase
      .from('bookings')
      .select(`
        *,
        clients:clients(id, name, phone, email, company),
        studios:studios(id, name, hourly_rate),
        booking_equipment:booking_equipment(
          id, equipment_id, quantity, unit_price, pickup_time, return_time, pickup_by, return_by,
          equipment:equipment(id, name, sku, status, hourly_rate)
        ),
        booking_assistants:booking_assistants(
          id, assistant_id, hours, unit_price,
          assistants:assistants(id, name, phone)
        ),
        payments:payments(
          id, amount, payment_method, transaction_no, is_deposit, notes, created_by, created_at
        )
      `)
      .order('created_at', { ascending: false })
    
    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.studio_id) {
      query = query.eq('studio_id', params.studio_id)
    }
    if (params.client_id) {
      query = query.eq('client_id', params.client_id)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Get bookings error:', error)
      return errorResponse('获取订单列表失败', 500)
    }
    
    return successResponse(data || [])
  } catch (error) {
    console.error('Get bookings error:', error)
    return errorResponse('获取订单列表失败', 500)
  }
}

const createBookingSchema = z.object({
  client_id: z.string().min(1),
  studio_id: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
  total_amount: z.number().min(0).optional(),
  deposit_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
  equipment_ids: z.array(z.string()).optional(),
  equipment_items: z.array(z.object({
    equipment_id: z.string(),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
  })).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = await requireStaff()
    const supabase = createClient()
    
    try {
      const body = await validateRequest(request, createBookingSchema)
      
      const { data: booking, error: bookingError }: any = await supabase
        .from('bookings')
        .insert({
          client_id: body.client_id,
          studio_id: body.studio_id || null,
          start_time: body.start_time,
          end_time: body.end_time,
          total_amount: body.total_amount || 0,
          deposit_amount: body.deposit_amount || 0,
          paid_amount: 0,
          notes: body.notes || null,
          created_by: userId,
        })
        .select('*, clients:clients(*), studios:studios(*)')
        .single()
      
      if (bookingError) {
        console.error('Create booking error:', bookingError)
        return errorResponse('创建订单失败: ' + bookingError.message, 500)
      }
      
      let bookingEquipment: any[] = []
      
      if (body.equipment_items && body.equipment_items.length > 0) {
        const equipmentInserts = body.equipment_items.map((item: any) => ({
          booking_id: booking.id,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
        
        const { data: beData, error: beError }: any = await supabase
          .from('booking_equipment')
          .insert(equipmentInserts)
          .select('*, equipment:equipment(*)')
        
        if (beError) {
          console.error('Insert booking equipment error:', beError)
        } else {
          bookingEquipment = beData || []
        }
      } else if (body.equipment_ids && body.equipment_ids.length > 0) {
        const { data: eqList }: any = await supabase
          .from('equipment')
          .select('id, hourly_rate')
          .in('id', body.equipment_ids)
        
        const equipmentInserts = (eqList || []).map((eq: any) => ({
          booking_id: booking.id,
          equipment_id: eq.id,
          quantity: 1,
          unit_price: eq.hourly_rate,
        }))
        
        if (equipmentInserts.length > 0) {
          const { data: beData, error: beError }: any = await supabase
            .from('booking_equipment')
            .insert(equipmentInserts)
            .select('*, equipment:equipment(*)')
          
          if (beError) {
            console.error('Insert booking equipment error:', beError)
          } else {
            bookingEquipment = beData || []
          }
        }
      }
      
      await insertAuditLog(userId, 'create_booking', 'booking', booking.id, null, { booking_no: booking.booking_no })
      
      const result = {
        ...booking,
        booking_equipment: bookingEquipment,
        booking_assistants: [],
        payments: [],
      }
      
      return successResponse({ booking_id: booking.id, booking: result }, 201)
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
    console.error('Create booking error:', error)
    return errorResponse('创建订单失败', 500)
  }
}
