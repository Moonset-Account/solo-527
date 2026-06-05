import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api/response'
import { validateRequest, getCurrentUserId } from '@/lib/api/handler'

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
    notes?: string
    created_at: string
    created_by?: string
  }>
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

const mockBookings: Record<string, Booking> = {
  '1': {
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
      { id: 'be1', equipment_id: '1', quantity: 1, unit_price: 80, equipment: { id: '1', name: 'Canon EOS R5', sku: 'CAM-001', status: 'available' } }
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
  '2': {
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
  '3': {
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
}

function addAuditLog(booking: Booking, action: string, oldValue?: any, newValue?: any, notes?: string) {
  booking.audit_logs.push({
    id: `log-${Date.now()}-${Math.random()}`,
    action,
    old_value: oldValue,
    new_value: newValue,
    notes,
    created_by: 'current-user',
    created_at: new Date().toISOString(),
  })
  booking.updated_at = new Date().toISOString()
}

function updatePaymentStatus(booking: Booking) {
  if (booking.paid_amount >= booking.total_amount && booking.paid_amount > 0) {
    booking.payment_status = 'paid'
  } else if (booking.paid_amount >= booking.deposit_amount && booking.deposit_amount > 0) {
    booking.payment_status = 'deposit_paid'
  } else if (booking.paid_amount > 0) {
    booking.payment_status = 'partial_paid'
  } else {
    booking.payment_status = 'unpaid'
  }
}

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
    const userId = await getCurrentUserId()
    const { id } = await params
    const booking = mockBookings[id]
    
    if (!booking) {
      return notFoundResponse('订单')
    }

    try {
      const body = await validateRequest(request, updateBookingSchema)
      const oldData = { ...booking }

      if (body.status && body.status !== booking.status) {
        addAuditLog(booking, 'update_status', booking.status, body.status)
        booking.status = body.status
      }

      if (body.contract_status && body.contract_status !== booking.contract_status) {
        addAuditLog(booking, 'update_contract_status', booking.contract_status, body.contract_status)
        booking.contract_status = body.contract_status
      }

      if (body.start_time || body.end_time) {
        const oldTime = { start_time: booking.start_time, end_time: booking.end_time }
        const newTime = { 
          start_time: body.start_time || booking.start_time, 
          end_time: body.end_time || booking.end_time 
        }
        if (body.start_time) booking.start_time = body.start_time
        if (body.end_time) booking.end_time = body.end_time
        addAuditLog(booking, 'reschedule', oldTime, newTime, '订单改期')
        if (booking.status !== 'rescheduled') {
          booking.status = 'rescheduled'
        }
      }

      if (body.notes !== undefined) {
        booking.notes = body.notes
      }

      if (body.total_amount !== undefined) {
        addAuditLog(booking, 'update_amount', booking.total_amount, body.total_amount)
        booking.total_amount = body.total_amount
        updatePaymentStatus(booking)
      }

      if (body.deposit_amount !== undefined) {
        booking.deposit_amount = body.deposit_amount
        updatePaymentStatus(booking)
      }

      if (body.studio_id) {
        booking.studio_id = body.studio_id
      }

      booking.updated_at = new Date().toISOString()
      
      return successResponse(booking)
    } catch (error: any) {
      if (error.message === 'VALIDATION_ERROR') {
        return validationErrorResponse(error.validationErrors)
      }
      throw error
    }
  } catch (error) {
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
    const userId = await getCurrentUserId()
    const { id } = await params
    const booking = mockBookings[id]
    
    if (!booking) {
      return notFoundResponse('订单')
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'add_payment') {
      try {
        const body = await validateRequest(request, paymentSchema)
        
        const newPayment = {
          id: `payment-${Date.now()}`,
          amount: body.amount,
          payment_method: body.payment_method,
          is_deposit: body.is_deposit || false,
          transaction_no: body.transaction_no,
          notes: body.notes,
          created_at: new Date().toISOString(),
          created_by: userId || 'user-1',
        }

        booking.payments.push(newPayment)
        booking.paid_amount += body.amount
        updatePaymentStatus(booking)
        
        addAuditLog(booking, 'add_payment', null, { 
          amount: body.amount, 
          method: body.payment_method,
          is_deposit: body.is_deposit 
        })

        return successResponse({ payment: newPayment, booking })
      } catch (error: any) {
        if (error.message === 'VALIDATION_ERROR') {
          return validationErrorResponse(error.validationErrors)
        }
        throw error
      }
    }

    if (action === 'checkout_equipment') {
      const body = await request.json().catch(() => ({}))
      const { equipment_id, pickup_by } = body

      const be = booking.booking_equipment.find(e => e.equipment_id === equipment_id)
      if (be) {
        be.pickup_time = new Date().toISOString()
        be.pickup_by = pickup_by || 'current-user'
        if (be.equipment) {
          be.equipment.status = 'rented'
        }
        addAuditLog(booking, 'checkout_equipment', equipment_id, null, `器材出库: ${be.equipment?.name}`)
      }

      return successResponse(booking)
    }

    if (action === 'return_equipment') {
      const body = await request.json().catch(() => ({}))
      const { equipment_id, return_by } = body

      const be = booking.booking_equipment.find(e => e.equipment_id === equipment_id)
      if (be) {
        be.return_time = new Date().toISOString()
        be.return_by = return_by || 'current-user'
        if (be.equipment) {
          be.equipment.status = 'available'
        }
        addAuditLog(booking, 'return_equipment', equipment_id, null, `器材归还: ${be.equipment?.name}`)
      }

      return successResponse(booking)
    }

    if (action === 'cancel') {
      const oldStatus = booking.status
      booking.status = 'cancelled'
      booking.booking_equipment.forEach(be => {
        if (be.equipment) be.equipment.status = 'available'
      })
      addAuditLog(booking, 'cancel_booking', oldStatus, 'cancelled')
      return successResponse(booking)
    }

    return errorResponse('未知操作', 400)
  } catch (error) {
    console.error('Booking action error:', error)
    return errorResponse('操作失败', 500)
  }
}
