import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/response'
import { getSearchParams } from '@/lib/api/handler'

const mockPayments = [
  {
    id: '1',
    booking_id: '1',
    amount: 500,
    payment_method: '微信',
    is_deposit: true,
    transaction_no: 'WX20240110123456',
    notes: '定金',
    created_by: 'user-1',
    created_at: '2024-01-10T14:35:00',
    bookings: { booking_no: 'BK202401150001' },
    creator: { full_name: '王经理' },
  },
  {
    id: '2',
    booking_id: '2',
    amount: 1000,
    payment_method: '银行转账',
    is_deposit: true,
    transaction_no: 'BANK202401080001',
    notes: '定金',
    created_by: 'user-1',
    created_at: '2024-01-08T11:20:00',
    bookings: { booking_no: 'BK202401150002' },
    creator: { full_name: '王经理' },
  },
  {
    id: '3',
    booking_id: '2',
    amount: 2000,
    payment_method: '支付宝',
    is_deposit: false,
    transaction_no: 'ALI202401140001',
    notes: '尾款',
    created_by: 'user-1',
    created_at: '2024-01-14T09:00:00',
    bookings: { booking_no: 'BK202401150002' },
    creator: { full_name: '王经理' },
  },
]

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)
    
    let filtered = [...mockPayments]
    
    if (params.booking_id) {
      filtered = filtered.filter(p => p.booking_id === params.booking_id)
    }
    
    return successResponse(filtered)
  } catch (error) {
    return errorResponse('获取支付记录失败', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newPayment = {
      id: `payment-${Date.now()}`,
      ...body,
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      bookings: { booking_no: body.booking_id ? `BK-${body.booking_id}` : 'NEW' },
      creator: { full_name: '当前用户' },
    }
    
    mockPayments.unshift(newPayment)
    
    return successResponse(newPayment, 201)
  } catch (error) {
    return errorResponse('创建支付记录失败', 500)
  }
}
