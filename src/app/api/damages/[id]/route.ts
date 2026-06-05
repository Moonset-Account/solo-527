import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { validateRequest, getCurrentUserId } from '@/lib/api/handler'

type Damage = {
  id: string
  equipment_id: string
  booking_id?: string
  reporter_id: string
  responsible_party: string
  severity: 'minor' | 'moderate' | 'severe' | 'total'
  description: string
  repair_cost: number
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  images?: string[]
  notes?: string
  created_at: string
  updated_at: string
  equipment: { id: string; name: string; sku: string }
  bookings?: { id: string; booking_no: string; client_name: string }
  reporter: { id: string; full_name: string; role?: string }
  audit_logs: Array<{
    id: string
    action: string
    old_value?: any
    new_value?: any
    notes?: string
    created_by: string
    created_at: string
  }>
}

const mockDamages: Record<string, Damage> = {
  '1': {
    id: '1',
    equipment_id: '1',
    booking_id: '1',
    reporter_id: 'user-2',
    responsible_party: '客户 张三',
    severity: 'minor',
    description: '机身底部有轻微划痕，不影响使用',
    repair_cost: 0,
    status: 'resolved',
    created_at: '2024-01-08T16:30:00',
    updated_at: '2024-01-09T10:00:00',
    equipment: { id: '1', name: 'Canon EOS R5', sku: 'CAM-001' },
    bookings: { id: '1', booking_no: 'BK20240110001', client_name: '张三' },
    reporter: { id: 'user-2', full_name: '李助理', role: 'photographer' },
    audit_logs: [
      { id: 'log1', action: 'create_damage', created_by: 'user-2', created_at: '2024-01-08T16:30:00' },
      { id: 'log2', action: 'update_status', old_value: 'reported', new_value: 'resolved', created_by: 'user-1', created_at: '2024-01-09T10:00:00', notes: '划痕轻微，无需维修' },
    ],
  },
  '2': {
    id: '2',
    equipment_id: '6',
    booking_id: '2',
    reporter_id: 'user-3',
    responsible_party: '拍摄助理 张助理',
    severity: 'moderate',
    description: '三脚架云台连接处松动，需要维修',
    repair_cost: 500,
    status: 'reported',
    created_at: '2024-01-14T11:00:00',
    updated_at: '2024-01-14T11:00:00',
    equipment: { id: '6', name: 'Manfrotto 三脚架', sku: 'TRIPOD-001' },
    bookings: { id: '2', booking_no: 'BK202401150002', client_name: '李四公司' },
    reporter: { id: 'user-3', full_name: '王助理', role: 'assistant' },
    audit_logs: [
      { id: 'log1', action: 'create_damage', created_by: 'user-3', created_at: '2024-01-14T11:00:00' },
    ],
  },
  '3': {
    id: '3',
    equipment_id: '4',
    booking_id: '3',
    reporter_id: 'user-1',
    responsible_party: '客户 王五公司',
    severity: 'severe',
    description: '闪光灯管破裂，无法正常闪光',
    repair_cost: 2800,
    status: 'investigating',
    created_at: '2024-01-12T09:15:00',
    updated_at: '2024-01-13T14:00:00',
    equipment: { id: '4', name: 'Profoto B10X Plus', sku: 'LIT-001' },
    bookings: { id: '3', booking_no: 'BK202401150003', client_name: '王五公司' },
    reporter: { id: 'user-1', full_name: '管理员', role: 'admin' },
    audit_logs: [
      { id: 'log1', action: 'create_damage', created_by: 'user-1', created_at: '2024-01-12T09:15:00' },
      { id: 'log2', action: 'update_status', old_value: 'reported', new_value: 'investigating', created_by: 'user-1', created_at: '2024-01-13T14:00:00', notes: '联系维修商报价中' },
    ],
  },
}

function addAuditLog(damage: Damage, action: string, oldValue?: any, newValue?: any, notes?: string) {
  damage.audit_logs.push({
    id: `log-${Date.now()}-${Math.random()}`,
    action,
    old_value: oldValue,
    new_value: newValue,
    notes,
    created_by: 'current-user',
    created_at: new Date().toISOString(),
  })
  damage.updated_at = new Date().toISOString()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const damage = mockDamages[id]
    
    if (!damage) {
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
    const userId = await getCurrentUserId()
    const { id } = await params
    const damage = mockDamages[id]
    
    if (!damage) {
      return notFoundResponse('损坏记录')
    }

    try {
      const body = await validateRequest(request, updateDamageSchema)

      if (body.status && body.status !== damage.status) {
        addAuditLog(damage, 'update_status', damage.status, body.status, body.notes)
        damage.status = body.status
      }

      if (body.severity && body.severity !== damage.severity) {
        addAuditLog(damage, 'update_severity', damage.severity, body.severity)
        damage.severity = body.severity
      }

      if (body.repair_cost !== undefined && body.repair_cost !== damage.repair_cost) {
        addAuditLog(damage, 'update_repair_cost', damage.repair_cost, body.repair_cost)
        damage.repair_cost = body.repair_cost
      }

      if (body.responsible_party && body.responsible_party !== damage.responsible_party) {
        addAuditLog(damage, 'update_responsible', damage.responsible_party, body.responsible_party)
        damage.responsible_party = body.responsible_party
      }

      if (body.description && body.description !== damage.description) {
        damage.description = body.description
      }

      if (body.notes !== undefined) {
        damage.notes = body.notes
      }

      damage.updated_at = new Date().toISOString()
      
      return successResponse(damage)
    } catch (error: any) {
      if (error.message === 'VALIDATION_ERROR') {
        return validationErrorResponse(error.validationErrors)
      }
      throw error
    }
  } catch (error) {
    console.error('Update damage error:', error)
    return errorResponse('更新损坏记录失败', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params
    const damage = mockDamages[id]
    
    if (!damage) {
      return notFoundResponse('损坏记录')
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'start_investigation') {
      const oldStatus = damage.status
      damage.status = 'investigating'
      addAuditLog(damage, 'update_status', oldStatus, 'investigating', '开始调查损坏原因')
      return successResponse(damage)
    }

    if (action === 'resolve') {
      const oldStatus = damage.status
      damage.status = 'resolved'
      const body = await request.json().catch(() => ({}))
      addAuditLog(damage, 'update_status', oldStatus, 'resolved', body.notes || '损坏已处理完毕')
      return successResponse(damage)
    }

    if (action === 'close') {
      const oldStatus = damage.status
      damage.status = 'closed'
      addAuditLog(damage, 'update_status', oldStatus, 'closed', '案件已关闭')
      return successResponse(damage)
    }

    if (action === 'reopen') {
      const oldStatus = damage.status
      damage.status = 'investigating'
      addAuditLog(damage, 'update_status', oldStatus, 'investigating', '重新打开调查')
      return successResponse(damage)
    }

    return errorResponse('未知操作', 400)
  } catch (error) {
    console.error('Damage action error:', error)
    return errorResponse('操作失败', 500)
  }
}
