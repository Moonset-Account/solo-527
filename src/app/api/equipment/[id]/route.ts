import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { validateRequest, requireStaff } from '@/lib/api/handler'

const mockEquipmentDetail: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Canon EOS R5',
    sku: 'CAM-001',
    status: 'available',
    hourly_rate: 80,
    daily_rate: 500,
    brand: 'Canon',
    model: 'EOS R5',
    category: { id: '1', name: '相机机身' },
    description: '专业全画幅微单相机，8K视频拍摄，4500万像素',
    notes: '购买时附带原装电池2块，充电器1个',
    serial_number: 'SN-R5-001234',
    purchase_price: 25999,
    purchase_date: '2023-06-15',
    qr_code: 'CAM-001-123456',
    created_at: '2023-06-15T10:00:00',
    rental_history: [
      {
        id: '1',
        booking_no: 'BK20240110001',
        client_name: '张三',
        start_time: '2024-01-10T09:00:00',
        end_time: '2024-01-10T18:00:00',
        pickup_by: '李助理',
        return_by: '王助理',
      },
      {
        id: '2',
        booking_no: 'BK20240105002',
        client_name: '李四公司',
        start_time: '2024-01-05T14:00:00',
        end_time: '2024-01-06T20:00:00',
        pickup_by: '张助理',
        return_by: '张助理',
      },
    ],
    damage_reports: [
      {
        id: '1',
        severity: 'minor',
        description: '机身底部有轻微划痕',
        reporter: '李助理',
        created_at: '2024-01-08T16:30:00',
        repair_cost: 0,
        status: 'resolved',
        booking_id: 'bk-001',
      },
    ],
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const equipment = mockEquipmentDetail[id] || mockEquipmentDetail['1']
    
    if (!equipment) {
      return notFoundResponse('器材')
    }
    
    return successResponse(equipment)
  } catch (error) {
    return errorResponse('获取器材详情失败', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff()
    const { id } = await params
    
    const body = await request.json()
    const equipment = mockEquipmentDetail[id] || mockEquipmentDetail['1']
    
    if (!equipment) {
      return notFoundResponse('器材')
    }
    
    mockEquipmentDetail[id] = {
      ...equipment,
      ...body,
      updated_at: new Date().toISOString()
    }
    
    return successResponse(mockEquipmentDetail[id])
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权', 401)
    }
    return errorResponse('更新器材失败', 500)
  }
}
