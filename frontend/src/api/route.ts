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
