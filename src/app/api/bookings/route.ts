import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { getSearchParams, validateRequest, requireStaff } from '@/lib/api/handler'

const mockBookings = [
  {
    id: '1',
    booking_no: 'BK202401150001',
    client_id: '1',
    studio_id: '1',
    status: 'confirmed',
    contract_status: 'signed',
    payment_status: 'deposit_paid',
    start_time: '2024-01-15T09:00:00',
    end_time: '2024-01-15T12:00:00',
    total_amount: 1500,
    deposit_amount: 500,
    paid_amount: 500,
    notes: '客户需要白色背景',
    created_by: 'user-1',
    created_at: '2024-01-10T14:30:00',
    updated_at: '2024-01-10T14:30:00',
    clients: { name: '张三', phone: '138****1234' },
    studios: { name: 'A棚 - 无影墙' },
    booking_equipment: [
      { id: '1', equipment_id: '1', quantity: 1, unit_price: 80, equipment: { id: '1', name: 'Canon EOS R5', sku: 'CAM-001' } }
    ],
    booking_assistants: [],
    payments: [
      { id: '1', amount: 500, payment_method: '微信', is_deposit: true, created_at: '2024-01-10T14:35:00' }
    ]
  },
  {
    id: '2',
    booking_no: 'BK202401150002',
    client_id: '2',
    studio_id: '2',
    status: 'in_progress',
    contract_status: 'signed',
    payment_status: 'paid',
    start_time: '2024-01-15T14:00:00',
    end_time: '2024-01-15T18:00:00',
    total_amount: 3000,
    deposit_amount: 1000,
    paid_amount: 3000,
    notes: '',
    created_by: 'user-1',
    created_at: '2024-01-08T10:00:00',
    updated_at: '2024-01-08T10:00:00',
    clients: { name: '李四', phone: '139****5678' },
    studios: { name: 'B棚 - 实景棚' },
    booking_equipment: [],
    booking_assistants: [],
    payments: []
  },
  {
    id: '3',
    booking_no: 'BK202401160003',
    client_id: '3',
    studio_id: '1',
    status: 'pending',
    contract_status: 'draft',
    payment_status: 'unpaid',
    start_time: '2024-01-16T09:00:00',
    end_time: '2024-01-16T17:00:00',
    total_amount: 6000,
    deposit_amount: 2000,
    paid_amount: 0,
    notes: '客户需要改期，待定',
    created_by: 'user-1',
    created_at: '2024-01-05T09:00:00',
    updated_at: '2024-01-05T09:00:00',
    clients: { name: '王五公司', phone: '137****9012' },
    studios: { name: 'A棚 - 无影墙' },
    booking_equipment: [],
    booking_assistants: [],
    payments: []
  },
]

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)
    
    let filtered = [...mockBookings]
    
    if (params.status) {
      filtered = filtered.filter(b => b.status === params.status)
    }
    if (params.studio_id) {
      filtered = filtered.filter(b => b.studio_id === params.studio_id)
    }
    if (params.client_id) {
      filtered = filtered.filter(b => b.client_id === params.client_id)
    }
    
    return successResponse(filtered)
  } catch (error) {
    return errorResponse('获取订单列表失败', 500)
  }
}

const createBookingSchema = z.object({
  client_id: z.string().uuid(),
  studio_id: z.string().uuid().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  total_amount: z.number().min(0),
  deposit_amount: z.number().min(0),
  notes: z.string().optional(),
  equipment_items: z.array(z.object({
    equipment_id: z.string().uuid(),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
  })).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = await requireStaff()
    
    try {
      const body = await validateRequest(request, createBookingSchema)
      
      const newBooking = {
        id: `booking-${Date.now()}`,
        booking_no: `BK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        ...body,
        status: 'draft',
        contract_status: 'draft',
        payment_status: 'unpaid',
        paid_amount: 0,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clients: { name: '新建客户', phone: '' },
        studios: body.studio_id ? { name: '选择的棚位' } : null,
        booking_equipment: [],
        booking_assistants: [],
        payments: []
      }
      
      mockBookings.unshift(newBooking as any)
      
      return successResponse({ booking_id: newBooking.id }, 201)
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
    return errorResponse('创建订单失败', 500)
  }
}
