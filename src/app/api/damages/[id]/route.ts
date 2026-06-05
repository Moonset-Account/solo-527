// @ts-nocheck
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { validateRequest, getCurrentUserId, requireStaff, insertAuditLog } from '@/lib/api/handler'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params
    
    const { data: damage, error } = await supabase
      .from('equipment_damages')
      .select(`
        *,
        equipment:equipment(*),
        bookings:bookings(id, booking_no, clients:clients(name, phone)),
        reporter:profiles(id, full_name, role)
      `)
      .eq('id', id)
      .single()
    
    if (error || !damage) {
      return notFoundResponse('损坏记录')
    }
    
    return successResponse(damage)
  } catch (error) {
    console.error('Get damage error:', error)
    return errorResponse('获取损坏详情失败', 500)
  }
}

const updateDamageSchema = z.object({
  status: z.enum(['reported', 'investigating', 'resolved', 'closed']).optional(),
  severity: z.enum(['minor', 'moderate', 'severe', 'total']).optional(),
  repair_cost: z.number().min(0).optional(),
  responsible_party: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireStaff()
    const supabase = createClient()
    const { id } = await params
    
    const { data: oldDamage, error: fetchError }: any = await supabase
      .from('equipment_damages')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !oldDamage) {
      return notFoundResponse('损坏记录')
    }

    try {
      const body = await validateRequest(request, updateDamageSchema)
      const updates: any = {}
      const auditChanges: any = {}

      if (body.status && body.status !== oldDamage.status) {
        updates.status = body.status
        auditChanges.status = { old: oldDamage.status, new: body.status }
      }

      if (body.severity && body.severity !== oldDamage.severity) {
        updates.severity = body.severity
        auditChanges.severity = { old: oldDamage.severity, new: body.severity }
      }

      if (body.repair_cost !== undefined && body.repair_cost !== oldDamage.repair_cost) {
        updates.repair_cost = body.repair_cost
        auditChanges.repair_cost = { old: oldDamage.repair_cost, new: body.repair_cost }
      }

      if (body.responsible_party && body.responsible_party !== oldDamage.responsible_party) {
        updates.responsible_party = body.responsible_party
        auditChanges.responsible_party = { old: oldDamage.responsible_party, new: body.responsible_party }
      }

      if (body.description && body.description !== oldDamage.description) {
        updates.description = body.description
      }

      if (body.notes !== undefined) {
        updates.notes = body.notes
      }

      if (Object.keys(updates).length === 0) {
        return successResponse(oldDamage)
      }

      const { data: updatedDamage, error: updateError }: any = await supabase
        .from('equipment_damages')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          equipment:equipment(*),
          bookings:bookings(id, booking_no, clients:clients(name)),
          reporter:profiles(id, full_name, role)
        `)
        .single()
      
      if (updateError) {
        console.error('Update damage error:', updateError)
        return errorResponse('更新损坏记录失败: ' + updateError.message, 500)
      }
      
      if (body.status === 'resolved' || body.status === 'closed') {
        const { error: eqError } = await supabase
          .from('equipment')
          .update({ status: 'available' })
          .eq('id', oldDamage.equipment_id)
        if (eqError) console.error('Update equipment status error:', eqError)
      }
      
      if (Object.keys(auditChanges).length > 0) {
        await insertAuditLog(userId, 'update_damage', 'equipment_damage', id, auditChanges, updates)
      }
      
      return successResponse(updatedDamage)
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
    console.error('Update damage error:', error)
    return errorResponse('更新损坏记录失败', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireStaff()
    const supabase = createClient()
    const { id } = await params
    
    const { data: damage, error: fetchError }: any = await supabase
      .from('equipment_damages')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !damage) {
      return notFoundResponse('损坏记录')
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const body = await request.json().catch(() => ({}))
    
    let newStatus: string | null = null
    let auditNotes = ''

    if (action === 'start_investigation') {
      newStatus = 'investigating'
      auditNotes = '开始调查损坏原因'
    } else if (action === 'resolve') {
      newStatus = 'resolved'
      auditNotes = body.notes || '损坏已处理完毕'
    } else if (action === 'close') {
      newStatus = 'closed'
      auditNotes = '案件已关闭'
    } else if (action === 'reopen') {
      newStatus = 'investigating'
      auditNotes = '重新打开调查'
    } else {
      return errorResponse('未知操作', 400)
    }
    
    if (newStatus && newStatus !== damage.status) {
      const { data: updatedDamage, error: updateError }: any = await supabase
        .from('equipment_damages')
        .update({ status: newStatus })
        .eq('id', id)
        .select(`
          *,
          equipment:equipment(*),
          bookings:bookings(id, booking_no, clients:clients(name)),
          reporter:profiles(id, full_name, role)
        `)
        .single()
      
      if (updateError) {
        console.error('Update damage status error:', updateError)
        return errorResponse('更新状态失败: ' + updateError.message, 500)
      }
      
      if (newStatus === 'resolved' || newStatus === 'closed') {
        await supabase
          .from('equipment')
          .update({ status: 'available' })
          .eq('id', damage.equipment_id)
      }
      
      await insertAuditLog(
        userId,
        'update_status',
        'equipment_damage',
        id,
        { status: damage.status },
        { status: newStatus, notes: auditNotes }
      )
      
      return successResponse(updatedDamage)
    }

    return successResponse(damage)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权', 401)
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse('没有权限', 403)
    }
    console.error('Damage action error:', error)
    return errorResponse('操作失败', 500)
  }
}
