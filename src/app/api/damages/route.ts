import { NextRequest } from 'next/server'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { getSearchParams, validateRequest, getCurrentUserId } from '@/lib/api/handler'
import { z } from 'zod'

const mockDamages = [
  {
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
    equipment: { name: 'Canon EOS R5', sku: 'CAM-001' },
    bookings: { booking_no: 'BK20240110001' },
    reporter: { full_name: '李助理' },
  },
  {
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
    equipment: { name: 'Manfrotto 三脚架', sku: 'TRIPOD-001' },
    bookings: { booking_no: 'BK202401150002' },
    reporter: { full_name: '王助理' },
  },
]

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)
    
    let filtered = [...mockDamages]
    
    if (params.equipment_id) {
      filtered = filtered.filter(d => d.equipment_id === params.equipment_id)
    }
    if (params.booking_id) {
      filtered = filtered.filter(d => d.booking_id === params.booking_id)
    }
    if (params.status) {
      filtered = filtered.filter(d => d.status === params.status)
    }
    
    return successResponse(filtered)
  } catch (error) {
    return errorResponse('获取损坏记录失败', 500)
  }
}

const damageSchema = z.object({
  equipment_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  responsible_party: z.string().min(1),
  severity: z.enum(['minor', 'moderate', 'severe', 'total']),
  description: z.string().min(1),
  repair_cost: z.number().min(0).optional(),
  images: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    
    try {
      const body = await validateRequest(request, damageSchema)
      
      const newDamage = {
        id: `damage-${Date.now()}`,
        ...body,
        reporter_id: userId || 'user-1',
        status: 'reported',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        equipment: { name: body.equipment_id ? '相关器材' : '未知器材', sku: '' },
        bookings: body.booking_id ? { booking_no: `BK-${body.booking_id}` } : null,
        reporter: { full_name: '当前用户' },
      }
      
      mockDamages.unshift(newDamage as any)
      
      return successResponse(newDamage, 201)
    } catch (error: any) {
      if (error.message === 'VALIDATION_ERROR') {
        return validationErrorResponse(error.validationErrors)
      }
      throw error
    }
  } catch (error) {
    return errorResponse('上报损坏失败', 500)
  }
}
