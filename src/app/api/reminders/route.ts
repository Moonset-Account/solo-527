import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/response'

const mockReminders = [
  {
    id: '1',
    booking_no: 'BK202401160003',
    total_amount: 6000,
    deposit_amount: 2000,
    paid_amount: 0,
    payment_status: 'unpaid',
    start_time: '2024-01-16T09:00:00',
    remaining_amount: 6000,
    days_until: 1,
    clients: { name: '王五公司', phone: '137****9012', email: 'wangwu@example.com' },
  },
  {
    id: '4',
    booking_no: 'BK202401200004',
    total_amount: 3500,
    deposit_amount: 1000,
    paid_amount: 1000,
    payment_status: 'deposit_paid',
    start_time: '2024-01-20T10:00:00',
    remaining_amount: 2500,
    days_until: 5,
    clients: { name: '赵六', phone: '136****3456', email: 'zhaoliu@example.com' },
  },
  {
    id: '5',
    booking_no: 'BK202401250005',
    total_amount: 8000,
    deposit_amount: 2500,
    paid_amount: 2500,
    payment_status: 'deposit_paid',
    start_time: '2024-01-25T09:00:00',
    remaining_amount: 5500,
    days_until: 10,
    clients: { name: '孙七公司', phone: '135****7890', email: 'sunqi@example.com' },
  },
]

export async function GET(request: NextRequest) {
  try {
    return successResponse(mockReminders)
  } catch (error) {
    return errorResponse('获取提醒失败', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { booking_ids, days_threshold = 7 } = body
    
    const toSend = booking_ids 
      ? mockReminders.filter(r => booking_ids.includes(r.id))
      : mockReminders.filter(r => r.days_until <= days_threshold)
    
    return successResponse({
      sent: toSend.length,
      results: toSend.map(r => ({ booking_id: r.id, success: true })),
    })
  } catch (error) {
    return errorResponse('发送提醒失败', 500)
  }
}
