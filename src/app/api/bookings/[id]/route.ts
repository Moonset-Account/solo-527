// @ts-nocheck
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { validateRequest, getCurrentUserId, requireStaff, insertAuditLog } from '@/lib/api/handler'
import { createClient } from '@/lib/supabase/server'

function calculatePaymentStatus(paid_amount: number, deposit_amount: number, total_amount: number): string {
  if (paid_amount >= total_amount && paid_amount > 0) return 'paid'
  if (paid_amount >= deposit_amount && deposit_amount > 0) return 'deposit_paid'
  if (paid_amount > 0) return 'partial_paid'
  return 'unpaid'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        clients:clients(*),
        studios:studios(*),
        booking_equipment:booking_equipment(
          *,
          equipment:equipment(*)
        ),
        booking_assistants:booking_assistants(
          *,
          assistants:assistants(*)
        ),
        payments:payments(*)
      `)
      .eq('id', id)
      .single()
    
    if (error || !booking) {
      return notFoundResponse('订单')
    }
    
    return successResponse(booking)
  } catch (error) {
    console.error('Get booking error:', error)
    return errorResponse('获取订单详情失败', 500)
  }
}

const updateBookingSchema = z.object({
  status: z.enum(['draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']).optional(),
  contract_status: z.enum(['draft', 'sent', 'signed', 'cancelled']).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  notes: z.string().optional(),
  total_amount: z.number().min(0).optional(),
  deposit_amount: z.number().min(0).optional(),
  studio_id: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireStaff()
    const supabase = createClient()
    const { id } = await params
    
    const { data: oldBooking, error: fetchError }: any = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !oldBooking) {
      return notFoundResponse('订单')
    }

    try {
      const body = await validateRequest(request, updateBookingSchema)
      const updates: any = {}
      const auditChanges: any = {}

      if (body.status && body.status !== oldBooking.status) {
        updates.status = body.status
        auditChanges.status = { old: oldBooking.status, new: body.status }
      }

      if (body.contract_status && body.contract_status !== oldBooking.contract_status) {
        updates.contract_status = body.contract_status
        auditChanges.contract_status = { old: oldBooking.contract_status, new: body.contract_status }
      }

      const isRescheduling = (body.start_time && body.start_time !== oldBooking.start_time) ||
                            (body.end_time && body.end_time !== oldBooking.end_time)
      
      if (isRescheduling) {
        const oldTime = { start_time: oldBooking.start_time, end_time: oldBooking.end_time }
        const newTime = { 
          start_time: body.start_time || oldBooking.start_time, 
          end_time: body.end_time || oldBooking.end_time 
        }
        updates.start_time = newTime.start_time
        updates.end_time = newTime.end_time
        auditChanges.reschedule = { old: oldTime, new: newTime }
        if (oldBooking.status !== 'rescheduled') {
          updates.status = 'rescheduled'
        }
      }

      if (body.notes !== undefined) {
        updates.notes = body.notes
      }

      if (body.total_amount !== undefined) {
        updates.total_amount = body.total_amount
        auditChanges.total_amount = { old: oldBooking.total_amount, new: body.total_amount }
      }

      if (body.deposit_amount !== undefined) {
        updates.deposit_amount = body.deposit_amount
      }

      if (body.studio_id) {
        updates.studio_id = body.studio_id
      }

      if (Object.keys(updates).length === 0) {
        return successResponse(oldBooking)
      }

      const { data: updatedBooking, error: updateError }: any = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          clients:clients(*),
          studios:studios(*),
          booking_equipment:booking_equipment(*, equipment:equipment(*)),
          payments:payments(*)
        `)
        .single()
      
      if (updateError) {
        console.error('Update booking error:', updateError)
        return errorResponse('更新订单失败: ' + updateError.message, 500)
      }
      
      if (Object.keys(auditChanges).length > 0) {
        await insertAuditLog(userId, 'update_booking', 'booking', id, auditChanges, updates)
      }
      
      return successResponse(updatedBooking)
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
    console.error('Update booking error:', error)
    return errorResponse('更新订单失败', 500)
  }
}

const paymentSchema = z.object({
  amount: z.number().min(0),
  payment_method: z.string().min(1),
  is_deposit: z.boolean().optional(),
  transaction_no: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireStaff()
    const supabase = createClient()
    const { id } = await params
    
    const { data: booking, error: fetchError }: any = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !booking) {
      return notFoundResponse('订单')
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'add_payment') {
      try {
        const body = await validateRequest(request, paymentSchema)
        
        const { data: payment, error: paymentError }: any = await supabase
          .from('payments')
          .insert({
            booking_id: id,
            amount: body.amount,
            payment_method: body.payment_method,
            is_deposit: body.is_deposit || false,
            transaction_no: body.transaction_no || null,
            notes: body.notes || null,
            created_by: userId,
          })
          .select('*')
          .single()
        
        if (paymentError) {
          console.error('Add payment error:', paymentError)
          return errorResponse('添加支付失败: ' + paymentError.message, 500)
        }
        
        const newPaidAmount = booking.paid_amount + body.amount
        const newPaymentStatus = calculatePaymentStatus(newPaidAmount, booking.deposit_amount, booking.total_amount)
        
        const { data: updatedBooking, error: updateError }: any = await supabase
          .from('bookings')
          .update({
            paid_amount: newPaidAmount,
            payment_status: newPaymentStatus,
          })
          .eq('id', id)
          .select(`
            *,
            clients:clients(*),
            studios:studios(*),
            booking_equipment:booking_equipment(*, equipment:equipment(*)),
            payments:payments(*)
          `)
          .single()
        
        if (updateError) {
          console.error('Update booking payment error:', updateError)
        }
        
        await insertAuditLog(userId, 'add_payment', 'booking', id, null, {
          amount: body.amount,
          payment_method: body.payment_method,
          is_deposit: body.is_deposit,
        })

        return successResponse({ payment, booking: updatedBooking || booking })
      } catch (error: any) {
        if (error.message === 'VALIDATION_ERROR') {
          return validationErrorResponse(error.validationErrors)
        }
        throw error
      }
    }

    if (action === 'checkout_equipment') {
      const body = await request.json().catch(() => ({}))
      const { equipment_id } = body
      
      if (!equipment_id) {
        return errorResponse('缺少器材ID', 400)
      }
      
      const { error: beError } = await supabase
        .from('booking_equipment')
        .update({
          pickup_time: new Date().toISOString(),
          pickup_by: userId,
        })
        .eq('booking_id', id)
        .eq('equipment_id', equipment_id)
      
      if (beError) {
        console.error('Checkout equipment error:', beError)
      }
      
      const { error: eqError } = await supabase
        .from('equipment')
        .update({ status: 'rented' })
        .eq('id', equipment_id)
      
      if (eqError) {
        console.error('Update equipment status error:', eqError)
      }
      
      await insertAuditLog(userId, 'checkout_equipment', 'booking', id, null, { equipment_id })
      
      const { data: updatedBooking }: any = await supabase
        .from('bookings')
        .select(`*, booking_equipment:booking_equipment(*, equipment:equipment(*))`)
        .eq('id', id)
        .single()

      return successResponse(updatedBooking)
    }

    if (action === 'return_equipment') {
      const body = await request.json().catch(() => ({}))
      const { equipment_id } = body
      
      if (!equipment_id) {
        return errorResponse('缺少器材ID', 400)
      }
      
      const { error: beError } = await supabase
        .from('booking_equipment')
        .update({
          return_time: new Date().toISOString(),
          return_by: userId,
        })
        .eq('booking_id', id)
        .eq('equipment_id', equipment_id)
      
      if (beError) {
        console.error('Return equipment error:', beError)
      }
      
      const { error: eqError } = await supabase
        .from('equipment')
        .update({ status: 'available' })
        .eq('id', equipment_id)
      
      if (eqError) {
        console.error('Update equipment status error:', eqError)
      }
      
      await insertAuditLog(userId, 'return_equipment', 'booking', id, null, { equipment_id })
      
      const { data: updatedBooking }: any = await supabase
        .from('bookings')
        .select(`*, booking_equipment:booking_equipment(*, equipment:equipment(*))`)
        .eq('id', id)
        .single()

      return successResponse(updatedBooking)
    }

    if (action === 'cancel') {
      const { data: updatedBooking, error: cancelError }: any = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select(`*, booking_equipment:booking_equipment(*, equipment:equipment(*))`)
        .single()
      
      if (cancelError) {
        console.error('Cancel booking error:', cancelError)
        return errorResponse('取消订单失败: ' + cancelError.message, 500)
      }
      
      const { data: bookingEquipment }: any = await supabase
        .from('booking_equipment')
        .select('equipment_id')
        .eq('booking_id', id)
      
      if (bookingEquipment && bookingEquipment.length > 0) {
        const equipmentIds = bookingEquipment.map((be: any) => be.equipment_id)
        await supabase
          .from('equipment')
          .update({ status: 'available' })
          .in('id', equipmentIds)
      }
      
      await insertAuditLog(userId, 'cancel_booking', 'booking', id, { status: booking.status }, { status: 'cancelled' })
      
      return successResponse(updatedBooking)
    }

    return errorResponse('未知操作', 400)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权', 401)
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse('没有权限', 403)
    }
    console.error('Booking action error:', error)
    return errorResponse('操作失败', 500)
  }
}
