import api from './api'
import type { Child, ChildClass, AuthorizedPerson, ApiResponse } from '@/types'

export const childApi = {
  getClasses: (params?: any) =>
    api.get<ApiResponse<ChildClass[]>>('/children/classes/', { params }),

  createClass: (data: any) =>
    api.post<ChildClass>('/children/classes/', data),

  updateClass: (id: number, data: any) =>
    api.patch<ChildClass>(`/children/classes/${id}/`, data),

  getList: (params?: any) =>
    api.get<ApiResponse<Child[]>>('/children/children/', { params }),

  getDetail: (id: number) =>
    api.get<Child>(`/children/children/${id}/`),

  create: (data: any) =>
    api.post<Child>('/children/children/', data),

  update: (id: number, data: any) =>
    api.patch<Child>(`/children/children/${id}/`, data),

  getAuthorizedPersons: (childId: number) =>
    api.get<AuthorizedPerson[]>(`/children/children/${childId}/authorized_persons/`),

  getAuthorizedPersonList: (params?: any) =>
    api.get<ApiResponse<AuthorizedPerson[]>>('/children/authorized-persons/', { params }),

  createAuthorizedPerson: (data: any) =>
    api.post<AuthorizedPerson>('/children/authorized-persons/', data),

  updateAuthorizedPerson: (id: number, data: any) =>
    api.patch<AuthorizedPerson>(`/children/authorized-persons/${id}/`, data)
}
