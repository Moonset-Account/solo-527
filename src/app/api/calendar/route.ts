import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/response'
import { getSearchParams } from '@/lib/api/handler'

const mockCalendarBookings = [
  {
    id: '1',
    booking_no: 'BK202401150001',
    status: 'confirmed',
    start_time: '2024-01-15T09:00:00',
    end_time: '2024-01-15T12:00:00',
    studio_id: '1',
    total_amount: 1500,
    payment_status: 'deposit_paid',
    clients: { name: '张三' },
    studios: { name: 'A棚 - 无影墙' }
  },
  {
    id: '2',
    booking_no: 'BK202401150002',
    status: 'in_progress',
    start_time: '2024-01-15T14:00:00',
    end_time: '2024-01-15T18:00:00',
    studio_id: '2',
    total_amount: 3000,
    payment_status: 'paid',
    clients: { name: '李四' },
    studios: { name: 'B棚 - 实景棚' }
  },
  {
    id: '3',
    booking_no: 'BK202401160003',
    status: 'pending',
    start_time: '2024-01-16T09:00:00',
    end_time: '2024-01-16T17:00:00',
    studio_id: '1',
    total_amount: 6000,
    payment_status: 'unpaid',
    clients: { name: '王五公司' },
    studios: { name: 'A棚 - 无影墙' }
  },
  {
    id: '4',
    booking_no: 'BK202401170004',
    status: 'confirmed',
    start_time: '2024-01-17T10:00:00',
    end_time: '2024-01-17T16:00:00',
    studio_id: '3',
    total_amount: 2000,
    payment_status: 'paid',
    clients: { name: '赵六' },
    studios: { name: 'C棚 - 小型棚' }
  },
]

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)
    
    let filtered = [...mockCalendarBookings]
    
    if (params.start_date) {
      filtered = filtered.filter(b => b.start_time >= params.start_date!)
    }
    if (params.end_date) {
      filtered = filtered.filter(b => b.end_time <= params.end_date!)
    }
    
    return successResponse(filtered)
  } catch (error) {
    return errorResponse('获取日历数据失败', 500)
  }
}
