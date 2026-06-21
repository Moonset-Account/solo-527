import { useApi } from './useApi'

export const useRectificationApi = () => {
  const api = useApi()

  return {
    getRectifications: (params?: Record<string, any>) => api.get<RectificationTask[]>('/rectification/', params),
    getRectification: (id: number) => api.get<RectificationTask>(`/rectification/${id}`),
    createRectification: (data: Partial<RectificationTask>) => api.post<RectificationTask>('/rectification/', data),
    updateRectification: (id: number, data: Partial<RectificationTask>) => api.put<RectificationTask>(`/rectification/${id}`, data),
    startRectification: (id: number) => api.post<RectificationTask>(`/rectification/${id}/start`),
    submitRectification: (id: number, result: string) =>
      api.post<RectificationTask>(`/rectification/${id}/submit`, null, { query: { result } }),
    reinspectRectification: (id: number, result: string, is_pass: boolean) =>
      api.post<RectificationTask>(`/rectification/${id}/reinspect`, null, { query: { result, is_pass } })
  }
}
