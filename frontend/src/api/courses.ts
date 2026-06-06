import request from '@/utils/request'
import type { Course, PaginatedResponse } from '@/types'

export const getCourses = (params?: any) => {
  return request.get<any, PaginatedResponse<Course>>('/courses', { params })
}

export const getCourse = (id: number) => {
  return request.get<any, Course>(`/courses/${id}`)
}

export const createCourse = (data: any) => {
  return request.post('/courses', data)
}

export const updateCourse = (id: number, data: any) => {
  return request.put(`/courses/${id}`, data)
}

export const deleteCourse = (id: number) => {
  return request.delete(`/courses/${id}`)
}

export const getCourseSchedules = (id: number) => {
  return request.get(`/courses/${id}/schedules`)
}
