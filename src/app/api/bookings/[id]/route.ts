import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { validateRequest, requireStaff } from '@/lib/api/handler'

const mockBookings: Record<string, any> = {
  '1': {
    id: '1',
    booking_no: 'BK202401150001',
    client_id: '1',
    studio_id: '1',
    package_id: null,
    status: 'confirmed',
    contract_status: 'signed',
    payment_status: 'deposit_paid',
    start_time: '2024-01-15T09:00:00',
    end_time: '2024-01-15T12:00:00',
    total_amount: 1500,
    deposit_amount: 500,
    paid_amount: 500,
    photographer_id: null,
    notes: '客户需要白色背景，准备3套服装',
    created_by: 'user-1',
    created_at: '2024-01-10T14:30:00',
    updated_at: '2024-01-10T14:30:00',
    clients: { id: '1', name: '张三', phone: '138****1234', email: 'zhangsan@example.com', company: '某某科技有限公司' },
    studios: { id: '1', name: 'A棚 - 无影墙', hourly_rate: 300 },
    packages: null,
    photographer: null,
    creator: { full_name: '王经理' },
    booking_equipment: [
      { id: '1', quantity: 1, unit_price: 80, equipment: { id: '1', name: 'Canon EOS R5', sku: 'CAM-001' } },
      { id: '2', quantity: 2, unit_price: 25, equipment: { id: '5', name: 'Godox SL60W', sku: 'LIT-002' } }
    ],
    booking_assistants: [
      { id: '1', hours: 4, unit_price: 100, assistants: { id: '1', name: '张助理', phone: '138****0001' } }
    ],
    payments: [
      { id: '1', amount: 500, payment_method: '微信', is_deposit: true, transaction_no: 'WX20240110123456', created_at: '2024-01-10T14:35:00', creator: { full_name: '王经理' } }
    ]
  },
  '2': {
    id: '2',
    booking_no: 'BK202401150002',
    client_id: '2',
    studio_id: '2',
    package_id: null,
    status: 'in_progress',
    contract_status: 'signed',
    payment_status: 'paid',
    start_time: '2024-01-15T14:00:00',
    end_time: '2024-01-15T18:00:00',
    total_amount: 3000,
    deposit_amount: 1000,
    paid_amount: 3000,
    photographer_id: 'user-2',
    notes: '',
    created_by: 'user-1',
    created_at: '2024-01-08T10:00:00',
    updated_at: '2024-01-08T10:00:00',
    clients: { id: '2', name: '李四', phone: '139****5678', email: 'lisi@example.com', company: null },
    studios: { id: '2', name: 'B棚 - 实景棚', hourly_rate: 400 },
    packages: null,
    photographer: { id: 'user-2', full_name: '李摄影师' },
    creator: { full_name: '王经理' },
    booking_equipment: [],
    booking_assistants: [],
    payments: []
  },
  '3': {
    id: '3',
    booking_no: 'BK202401160003',
    client_id: '3',
    studio_id: '1',
    package_id: null,
    status: 'pending',
    contract_status: 'draft',
    payment_status: 'unpaid',
    start_time: '2024-01-16T09:00:00',
    end_time: '2024-01-16T17:00:00',
    total_amount: 6000,
    deposit_amount: 2000,
    paid_amount: 0,
    photographer_id: null,
    notes: '客户需要改期，待定',
    created_by: 'user-1',
    created_at: '2024-01-05T09:00:00',
    updated_at: '2024-01-05T09:00:00',
    clients: { id: '3', name: '王五公司', phone: '137****9012', email: 'wangwu@example.com', company: '王五广告公司' },
    studios: { id: '1', name: 'A棚 - 无影墙', hourly_rate: 300 },
    packages: null,
    photographer: null,
    creator: { full_name: '王经理' },
    booking_equipment: [],
    booking_assistants: [],
    payments: []
  }
}

const updateBookingSchema = z.object({
  status: z.enum(['draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled']).optional(),
  contract_status: z.enum(['draft', 'sent', 'signed', 'cancelled']).optional(),
  payment_status: z.enum(['unpaid', 'deposit_paid', 'partial_paid', 'paid', 'refunded']).optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  studio_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  deposit_amount: z.number().min(0).optional(),
  total_amount: z.number().min(0).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const booking = mockBookings[id]
    
    if (!booking) {
      return notFoundResponse('订单')
    }
    
    return successResponse(booking)
  } catch (error) {
    return errorResponse('获取订单详情失败', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff()
    const { id } = await params
    
    try {
      const body = await validateRequest(request, updateBookingSchema)
      const booking = mockBookings[id]
      
      if (!booking) {
        return notFoundResponse('订单')
      }
      
      mockBookings[id] = {
        ...booking,
        ...body,
        updated_at: new Date().toISOString()
      }
      
      return successResponse(mockBookings[id])
    } catch (error: any) {
      if (error.message === 'VALIDATION_ERROR') {
        return validationErrorResponse(error.validationErrors)
      }
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权', 401)
    }
    return errorResponse('更新订单失败', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff()
    const { id } = await params
    
    if (!mockBookings[id]) {
      return notFoundResponse('订单')
    }
    
    mockBookings[id].status = 'cancelled'
    mockBookings[id].updated_at = new Date().toISOString()
    
    return successResponse({ message: '订单已取消' })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('未授权', 401)
    }
    return errorResponse('取消订单失败', 500)
  }
}
