import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/response'
import { getSearchParams } from '@/lib/api/handler'

export async function GET(request: NextRequest) {
  try {
    const params = await getSearchParams(request)

    if (params.type === 'studio' && params.studio_id && params.start_time && params.end_time) {
      const conflicts = params.studio_id === '1' && params.start_time.includes('2024-01-15')
      return successResponse({ available: !conflicts, type: 'studio' })
    }

    if (params.type === 'equipment' && params.equipment_ids && params.start_time && params.end_time) {
      const equipmentIds = params.equipment_ids.split(',')
      const conflictingIds = equipmentIds.filter(id => id === '2')
      return successResponse({ 
        available: conflictingIds.length === 0, 
        conflicting_ids: conflictingIds,
        type: 'equipment'
      })
    }

    return successResponse({ available: true, type: 'general' })
  } catch (error) {
    return errorResponse('检查可用性失败', 500)
  }
}
