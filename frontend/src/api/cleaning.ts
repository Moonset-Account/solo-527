import request from '@/utils/request'
import type { CleaningTask, PageResult, Result } from '@/types'

export const getCleaningTaskList = (params: {
  page?: number
  size?: number
  hotelCode?: string
  roomNumber?: string
  taskDate?: string
  taskStatus?: string
  taskType?: string
  assignee?: string
}) => {
  return request.get<Result<PageResult<CleaningTask>>>('/admin/cleaning-tasks', { params })
}

export const getCleaningTaskById = (id: number) => {
  return request.get<Result<CleaningTask>>(`/admin/cleaning-tasks/${id}`)
}

export const getTodayTasks = (status?: string) => {
  return request.get<Result<CleaningTask[]>>('/admin/cleaning-tasks/today', {
    params: status ? { status } : {},
  })
}

export const createCleaningTask = (data: CleaningTask) => {
  return request.post<Result<CleaningTask>>('/admin/cleaning-tasks', data)
}

export const updateCleaningTask = (data: CleaningTask) => {
  return request.put<Result<CleaningTask>>('/admin/cleaning-tasks', data)
}

export const updateCleaningTaskStatus = (id: number, status: string) => {
  return request.put<Result<CleaningTask>>(`/admin/cleaning-tasks/${id}/status`, null, {
    params: { status },
  })
}

export const deleteCleaningTask = (id: number) => {
  return request.delete<Result<void>>(`/admin/cleaning-tasks/${id}`)
}
