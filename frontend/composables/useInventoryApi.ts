import { useApi } from './useApi'

export const useInventoryApi = () => {
  const api = useApi()

  return {
    getInventory: (params?: Record<string, any>) => api.get<InventoryItem[]>('/inventory/', params),
    getLowStock: (params?: Record<string, any>) => api.get<InventoryItem[]>('/inventory/low-stock', params),
    getInventoryItem: (id: number) => api.get<InventoryItem>(`/inventory/${id}`),
    createInventory: (data: Partial<InventoryItem>) => api.post<InventoryItem>('/inventory/', data),
    updateInventory: (id: number, data: Partial<InventoryItem>) => api.put<InventoryItem>(`/inventory/${id}`, data),
    stockIn: (id: number, quantity: number) =>
      api.post<InventoryItem>(`/inventory/${id}/stock-in`, null, { query: { quantity } }),
    stockOut: (id: number, quantity: number) =>
      api.post<InventoryItem>(`/inventory/${id}/stock-out`, null, { query: { quantity } }),

    getAlerts: (params?: Record<string, any>) => api.get<StockAlert[]>('/inventory/alerts/', params),
    handleAlert: (id: number, handle_result: string, remark?: string) =>
      api.put<StockAlert>(`/inventory/alerts/${id}/handle`, null, { query: { handle_result, remark } }),
    checkAlerts: () => api.post('/inventory/check-alerts')
  }
}
