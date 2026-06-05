import { NextRequest } from 'next/server'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { getSearchParams, validateRequest, requireStaff } from '@/lib/api/handler'
import { z } from 'zod'

const mockClients = [
  {
    id: '1',
    name: '张三',
    company: '',
    phone: '138****1234',
    email: 'zhangsan@example.com',
    client_type: 'individual',
    total_bookings: 5,
    total_spent: 12500,
    last_booking: '2024-01-10',
    created_at: '2023-10-15',
  },
  {
    id: '2',
    name: '李四公司',
    company: '李四文化传媒有限公司',
    phone: '139****5678',
    email: 'lisi@example.com',
    client_type: 'corporate',
    total_bookings: 12,
    total_spent: 85000,
    last_booking: '2024-01-12',
    created_at: '2023-05-20',
  },
  {
    id: '3',
    name: '王五公司',
    company: '王五广告制作有限公司',
    phone: '137****9012',
    email: 'wangwu@example.com',
    client_type: 'corporate',
    total_bookings: 8,
    total_spent: 45000,
    last_booking: '2024-01-08',
    created_at: '2023-08-01',
  },
  {
    id: '4',
    name: '赵六',
    company: '',
    phone: '136****3456',
    email: 'zhaoliu@example.com',
    client_type: 'individual',
    total_bookings: 3,
    total_spent: 8500,
    last_booking: '2024-01-05',
    created_at: '2023-12-01',
  },
]

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)
    
    let filtered = [...mockClients]
    
    if (params.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search)
      )
    }
    if (params.client_type) {
      filtered = filtered.filter(c => c.client_type === params.client_type)
    }
    
    return successResponse(filtered)
  } catch (error) {
    return errorResponse('获取客户列表失败', 500)
  }
}

const clientSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  client_type: z.enum(['individual', 'corporate']).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireStaff()
    
    try {
      const body = await validateRequest(request, clientSchema)
      
      const newClient = {
        id: `client-${Date.now()}`,
        ...body,
        total_bookings: 0,
        total_spent: 0,
        last_booking: null,
        created_at: new Date().toISOString(),
      }
      
      mockClients.unshift(newClient as any)
      
      return successResponse(newClient, 201)
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
    return errorResponse('创建客户失败', 500)
  }
}
