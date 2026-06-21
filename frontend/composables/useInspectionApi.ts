import { useApi } from './useApi'

export const useInspectionApi = () => {
  const api = useApi()

  return {
    getInspections: (params?: any) => api.get<InspectionTask[]>('/inspection/', params),
    getInspection: (id: number) => api.get<InspectionTask>(`/inspection/${id}`),
    createInspection: (data: Partial<InspectionTask>) => api.post<InspectionTask>('/inspection/', data),
    updateInspection: (id: number, data: Partial<InspectionTask>) => api.put<InspectionTask>(`/inspection/${id}`, data),
    startInspection: (id: number) => api.post<InspectionTask>(`/inspection/${id}/start`),
    completeInspection: (id: number, score: number, remark?: string) =>
      api.post<InspectionTask>(`/inspection/${id}/complete`, null, { query: { score, remark } }),

    getCheckRecords: (inspectionId: number) =>
      api.get<InspectionCheckRecord[]>(`/inspection/${inspectionId}/checks`),
    addCheckRecord: (inspectionId: number, data: any) =>
      api.post<InspectionCheckRecord>(`/inspection/${inspectionId}/checks`, data),

    getInspectionRectifications: (inspectionId: number) =>
      api.get<RectificationTask[]>(`/inspection/${inspectionId}/rectifications`)
  }
}

export const useRectificationApi = () => {
  const api = useApi()

  return {
    getRectifications: (params?: any) => api.get<RectificationTask[]>('/rectification/', params),
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
