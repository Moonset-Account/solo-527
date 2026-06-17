import request from '@/utils/request'
import type { TourRoute, PageResult, Result } from '@/types'

export const getPublicRoutes = (params: {
  page?: number
  size?: number
  routeName?: string
  city?: string
  status?: string
}) => {
  return request.get<Result<PageResult<TourRoute>>>('/public/routes', { params })
}

export const getPublicRouteById = (id: number) => {
  return request.get<Result<TourRoute>>(`/public/routes/${id}`)
}

export const getAllActiveRoutes = () => {
  return request.get<Result<TourRoute[]>>('/public/routes/all')
}

export const getAdminRoutes = (params: {
  page?: number
  size?: number
  routeName?: string
  city?: string
  status?: string
}) => {
  return request.get<Result<PageResult<TourRoute>>>('/admin/routes', { params })
}

export const getAdminRouteById = (id: number) => {
  return request.get<Result<TourRoute>>(`/admin/routes/${id}`)
}

export const createRoute = (data: TourRoute) => {
  return request.post<Result<TourRoute>>('/admin/routes', data)
}

export const updateRoute = (data: TourRoute) => {
  return request.put<Result<TourRoute>>('/admin/routes', data)
}

export const deleteRoute = (id: number) => {
  return request.delete<Result<void>>(`/admin/routes/${id}`)
}
