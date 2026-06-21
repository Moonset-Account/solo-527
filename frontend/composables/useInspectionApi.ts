import { useApi } from './useApi'

export const useInspectionApi = () => {
  const api = useApi()

  return {
    getInspections: (params?: Record<string, any>) => api.get<InspectionTask[]>('/inspection/', params),
    getInspection: (id: number) => api.get<InspectionTask>(`/inspection/${id}`),
    createInspection: (data: Partial<InspectionTask>) => api.post<InspectionTask>('/inspection/', data),
    updateInspection: (id: number, data: Partial<InspectionTask>) => api.put<InspectionTask>(`/inspection/${id}`, data),
    startInspection: (id: number) => api.post<InspectionTask>(`/inspection/${id}/start`),
    completeInspection: (id: number, score: number, remark?: string) =>
      api.post<InspectionTask>(`/inspection/${id}/complete`, null, { score, remark }),

    getCheckRecords: (inspectionId: number) =>
      api.get<InspectionCheckRecord[]>(`/inspection/${inspectionId}/checks`),
    addCheckRecord: (inspectionId: number, data: Partial<InspectionCheckRecord>) =>
      api.post<InspectionCheckRecord>(`/inspection/${inspectionId}/checks`, data),

    getInspectionRectifications: (inspectionId: number) =>
      api.get<RectificationTask[]>(`/inspection/${inspectionId}/rectifications`)
  }
}
