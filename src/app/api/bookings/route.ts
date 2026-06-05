import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { getSearchParams, validateRequest, requireStaff, getCurrentUserId } from '@/lib/api/handler'

type Booking = {
  id: string
  booking_no: string
  client_id: string
  studio_id?: string
  status: 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
  contract_status: 'draft' | 'sent' | 'signed' | 'cancelled'
  payment_status: 'unpaid' | 'deposit_paid' | 'partial_paid' | 'paid' | 'refunded'
  start_time: string
  end_time: string
  total_amount: number
  deposit_amount: number
  paid_amount: number
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  clients: { name: string; phone: string; email?: string }
  studios?: { name: string }
  booking_equipment: Array<{
    id: string
    equipment_id: string
    quantity: number
    unit_price: number
    equipment?: { id: string; name: string; sku: string; status?: string }
    pickup_time?: string
    pickup_by?: string
    return_time?: string
    return_by?: string
  }>
  booking_assistants: any[]
  payments: Array<{
    id: string
    amount: number
    payment_method: string
    is_deposit: boolean
    transaction_no?: string
    created_at: string
    created_by?: string
  }>
  audit_logs: Array<{
    id: string
    action: string
    old_value?: any
    new_value?: any
    created_by: string
    created_at: string
  }>
}

const mockBookings: Booking[] = [
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
    clients: { name: '张三', phone: '138****1234', email: 'zhangsan@example.com' },
    studios: { name: 'A棚 - 无影墙' },
    booking_equipment: [
      { id: 'be1', equipment_id: '1', quantity: 1, unit_price: 80, equipment: { id: '1', name: 'Canon EOS R5', sku: 'CAM-001', status: 'rented' } }
    ],
    booking_assistants: [],
    payments: [
      { id: 'p1', amount: 500, payment_method: '微信', is_deposit: true, created_at: '2024-01-10T14:35:00', created_by: 'user-1' }
    ],
    audit_logs: [
      { id: 'log1', action: 'create_booking', created_by: 'user-1', created_at: '2024-01-10T14:30:00' },
      { id: 'log2', action: 'update_status', old_value: 'draft', new_value: 'confirmed', created_by: 'user-1', created_at: '2024-01-10T14:32:00' },
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
    clients: { name: '李四公司', phone: '139****5678', email: 'lisi@example.com' },
    studios: { name: 'B棚 - 实景棚' },
    booking_equipment: [
      { id: 'be2', equipment_id: '2', quantity: 1, unit_price: 70, equipment: { id: '2', name: 'Sony A7 IV', sku: 'CAM-002', status: 'rented' }, pickup_time: '2024-01-15T13:30:00', pickup_by: '张助理' }
    ],
    booking_assistants: [],
    payments: [
      { id: 'p2', amount: 1000, payment_method: '银行转账', is_deposit: true, created_at: '2024-01-08T11:00:00', created_by: 'user-1' },
      { id: 'p3', amount: 2000, payment_method: '支付宝', is_deposit: false, created_at: '2024-01-14T09:00:00', created_by: 'user-1' },
    ],
    audit_logs: []
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
    clients: { name: '王五公司', phone: '137****9012', email: 'wangwu@example.com' },
    studios: { name: 'A棚 - 无影墙' },
    booking_equipment: [],
    booking_assistants: [],
    payments: [],
    audit_logs: []
  },
]

const clientMap: Record<string, { name: string; phone: string; email?: string }> = {
  '1': { name: '张三', phone: '138****1234', email: 'zhangsan@example.com' },
  '2': { name: '李四公司', phone: '139****5678', email: 'lisi@example.com' },
  '3': { name: '王五公司', phone: '137****9012', email: 'wangwu@example.com' },
  '4': { name: '赵六', phone: '136****3456', email: 'zhaoliu@example.com' },
}

const studioMap: Record<string, { name: string }> = {
  '1': { name: 'A棚 - 无影墙' },
  '2': { name: 'B棚 - 实景棚' },
  '3': { name: 'C棚 - 绿幕棚' },
}

const equipmentMap: Record<string, { id: string; name: string; sku: string; hourly_rate: number }> = {
  '1': { id: '1', name: 'Canon EOS R5', sku: 'CAM-001', hourly_rate: 80 },
  '2': { id: '2', name: 'Sony A7 IV', sku: 'CAM-002', hourly_rate: 70 },
  '3': { id: '3', name: 'Canon 24-70mm f/2.8', sku: 'LEN-001', hourly_rate: 40 },
  '4': { id: '4', name: 'Profoto B10X Plus', sku: 'LIT-001', hourly_rate: 60 },
  '5': { id: '5', name: 'Godox SL60W', sku: 'LIT-002', hourly_rate: 25 },
}

function addAuditLog(booking: Booking, action: string, oldValue?: any, newValue?: any) {
  booking.audit_logs.push({
    id: `log-${Date.now()}-${Math.random()}`,
    action,
    old_value: oldValue,
    new_value: newValue,
    created_by: 'current-user',
    created_at: new Date().toISOString(),
  })
  booking.updated_at = new Date().toISOString()
}

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
  client_id: z.string().min(1),
  studio_id: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
  total_amount: z.number().min(0),
  deposit_amount: z.number().min(0),
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
    const userId = await getCurrentUserId()
    
    try {
      const body = await validateRequest(request, createBookingSchema)
      
      let bookingEquipment: Booking['booking_equipment'] = []
      
      if (body.equipment_items && body.equipment_items.length > 0) {
        bookingEquipment = body.equipment_items.map((item: any, index: number) => ({
          id: `be-${Date.now()}-${index}`,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          equipment: equipmentMap[item.equipment_id] ? { ...equipmentMap[item.equipment_id], status: 'rented' } : undefined,
        }))
      } else if (body.equipment_ids && body.equipment_ids.length > 0) {
        bookingEquipment = body.equipment_ids.map((eqId: string, index: number) => ({
          id: `be-${Date.now()}-${index}`,
          equipment_id: eqId,
          quantity: 1,
          unit_price: equipmentMap[eqId]?.hourly_rate || 0,
          equipment: equipmentMap[eqId] ? { ...equipmentMap[eqId], status: 'rented' } : undefined,
        }))
      }
      
      const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        booking_no: `BK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        client_id: body.client_id,
        studio_id: body.studio_id,
        status: 'draft',
        contract_status: 'draft',
        payment_status: 'unpaid',
        start_time: body.start_time,
        end_time: body.end_time,
        total_amount: body.total_amount,
        deposit_amount: body.deposit_amount,
        paid_amount: 0,
        notes: body.notes,
        created_by: userId || 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clients: clientMap[body.client_id] || { name: '客户', phone: '' },
        studios: body.studio_id ? studioMap[body.studio_id] : undefined,
        booking_equipment: bookingEquipment,
        booking_assistants: [],
        payments: [],
        audit_logs: [
          {
            id: `log-${Date.now()}`,
            action: 'create_booking',
            created_by: userId || 'user-1',
            created_at: new Date().toISOString(),
          }
        ],
      }
      
      mockBookings.unshift(newBooking)
      
      return successResponse({ booking_id: newBooking.id, booking: newBooking }, 201)
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
    console.error('Create booking error:', error)
    return errorResponse('创建订单失败', 500)
  }
}
