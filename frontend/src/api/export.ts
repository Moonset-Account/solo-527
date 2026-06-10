import request from './request'
import type { ApiResponse } from '@/types'

export const exportProjectData = (projectId: number) => {
  return request.get<ApiResponse<string>, ApiResponse<string>>(`/export/project/${projectId}`, {
    responseType: 'blob' as unknown as undefined
  })
}
