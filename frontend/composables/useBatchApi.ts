import { useApi } from './useApi'

export const useBatchApi = () => {
  const api = useApi()

  return {
    getBatches: (params?: Record<string, any>) => api.get<BakingBatch[]>('/batch/', params),
    getBatch: (id: number) => api.get<BakingBatch>(`/batch/${id}`),
    createBatch: (data: Partial<BakingBatch>) => api.post<BakingBatch>('/batch/', data),
    updateBatch: (id: number, data: Partial<BakingBatch>) => api.put<BakingBatch>(`/batch/${id}`, data),
    completeBatch: (id: number, actual_quantity: number) =>
      api.post<BakingBatch>(`/batch/${id}/complete`, null, { actual_quantity }),

    getLossRecords: (params?: Record<string, any>) => api.get<LossRecord[]>('/batch/loss/', params),
    getLossRecord: (id: number) => api.get<LossRecord>(`/batch/loss/${id}`),
    createLoss: (data: Partial<LossRecord>) => api.post<LossRecord>('/batch/loss', data),
    updateLoss: (id: number, data: Partial<LossRecord>) => api.put<LossRecord>(`/batch/loss/${id}`, data),
    handleLoss: (id: number, handle_result: string) =>
      api.post<LossRecord>(`/batch/loss/${id}/handle`, null, { query: { handle_result } }),
    getLossStats: (params?: Record<string, any>) => api.get('/batch/loss/stats/summary', params),

    getBatchLoss: (batchId: number) => api.get<LossRecord[]>(`/batch/${batchId}/loss`)
  }
}
