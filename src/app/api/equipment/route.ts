import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { getSearchParams, validateRequest, requireStaff } from '@/lib/api/handler'

const mockEquipment = [
  {
    id: '1',
    name: 'Canon EOS R5',
    sku: 'CAM-001',
    status: 'available',
    hourly_rate: 80,
    daily_rate: 500,
    brand: 'Canon',
    model: 'EOS R5',
    category: { name: '相机机身' },
    description: '专业全画幅微单相机，8K视频拍摄',
    serial_number: 'SN-R5-001234',
    purchase_price: 25999,
    purchase_date: '2023-06-15',
  },
  {
    id: '2',
    name: 'Sony A7 IV',
    sku: 'CAM-002',
    status: 'rented',
    hourly_rate: 70,
    daily_rate: 450,
    brand: 'Sony',
    model: 'A7 IV',
    category: { name: '相机机身' },
    description: '全画幅微单相机，3300万像素',
    serial_number: 'SN-A74-001',
    purchase_price: 16999,
    purchase_date: '2023-03-20',
  },
  {
    id: '3',
    name: 'Canon 24-70mm f/2.8',
    sku: 'LEN-001',
    status: 'available',
    hourly_rate: 40,
    daily_rate: 250,
    brand: 'Canon',
    model: 'EF 24-70mm f/2.8L II',
    category: { name: '镜头' },
    description: '标准变焦镜头，大光圈',
    serial_number: 'SN-LEN-001',
    purchase_price: 12800,
    purchase_date: '2023-01-10',
  },
  {
    id: '4',
    name: 'Profoto B10X Plus',
    sku: 'LIT-001',
    status: 'rented',
    hourly_rate: 60,
    daily_rate: 400,
    brand: 'Profoto',
    model: 'B10X Plus',
    category: { name: '灯光设备' },
    description: '专业离机闪光灯，500Ws',
    serial_number: 'SN-LIT-001',
    purchase_price: 18900,
    purchase_date: '2023-05-01',
  },
  {
    id: '5',
    name: 'Godox SL60W',
    sku: 'LIT-002',
    status: 'available',
    hourly_rate: 25,
    daily_rate: 150,
    brand: 'Godox',
    model: 'SL60W',
    category: { name: '灯光设备' },
    description: 'LED常亮灯，60W',
    serial_number: 'SN-LIT-002',
    purchase_price: 899,
    purchase_date: '2023-02-15',
  },
  {
    id: '6',
    name: 'Manfrotto 三脚架',
    sku: 'TRIPOD-001',
    status: 'maintenance',
    hourly_rate: 15,
    daily_rate: 100,
    brand: 'Manfrotto',
    model: 'MT055',
    category: { name: '三脚架/稳定器' },
    description: '专业碳纤维三脚架',
    serial_number: 'SN-TRIPOD-001',
    purchase_price: 3200,
    purchase_date: '2022-12-01',
  },
]

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)
    
    let filtered = [...mockEquipment]
    
    if (params.category_id) {
      filtered = filtered.filter(e => e.category.name === params.category_id)
    }
    if (params.status) {
      filtered = filtered.filter(e => e.status === params.status)
    }
    if (params.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(search) || 
        e.sku.toLowerCase().includes(search) ||
        e.brand.toLowerCase().includes(search)
      )
    }
    
    return successResponse(filtered)
  } catch (error) {
    return errorResponse('获取器材列表失败', 500)
  }
}

const createEquipmentSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category_id: z.string().uuid().optional(),
  hourly_rate: z.number().min(0),
  daily_rate: z.number().min(0).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  description: z.string().optional(),
  serial_number: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireStaff()
    
    try {
      const body = await validateRequest(request, createEquipmentSchema)
      
      const newEquipment = {
        id: `eq-${Date.now()}`,
        ...body,
        status: 'available',
        category: { name: '未分类' },
        created_at: new Date().toISOString(),
      }
      
      mockEquipment.unshift(newEquipment as any)
      
      return successResponse(newEquipment, 201)
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
    return errorResponse('创建器材失败', 500)
  }
}
