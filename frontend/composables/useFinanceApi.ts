import { useApi } from './useApi'

export const useFinanceApi = () => {
  const api = useApi()

  return {
    getCashFlows: (params?: any) => api.get<CashFlow[]>('/finance/cash-flow', params),
    getCashFlowSummary: (params?: any) => api.get('/finance/cash-flow/summary', params),
    createCashFlow: (data: Partial<CashFlow>) => api.post<CashFlow>('/finance/cash-flow', data),

    getLaborRecords: (params?: any) => api.get<LaborRecord[]>('/finance/labor', params),
    getLaborStats: (params?: any) => api.get('/finance/labor/stats', params),
    createLaborRecord: (data: Partial<LaborRecord>) => api.post<LaborRecord>('/finance/labor', data),
    updateLaborRecord: (id: number, data: Partial<LaborRecord>) => api.put<LaborRecord>(`/finance/labor/${id}`, data)
  }
}

export const useSettingsApi = () => {
  const api = useApi()

  return {
    getSettings: (params?: any) => api.get<SystemSetting[]>('/settings/', params),
    getModuleSettings: (module: string) => api.get(`/settings/module/${module}`),
    getAllEnabled: () => api.get<Record<string, Record<string, any>>>('/settings/all-enabled'),
    isModuleEnabled: (module: string) => api.get(`/settings/module/${module}/enabled`),
    getSetting: (id: number) => api.get<SystemSetting>(`/settings/${id}`),
    createSetting: (data: Partial<SystemSetting>) => api.post<SystemSetting>('/settings/', data),
    updateSetting: (id: number, data: Partial<SystemSetting>) => api.put<SystemSetting>(`/settings/${id}`, data),
    setSettingValue: (module: string, key: string, value: string, value_type?: string, description?: string) =>
      api.put(`/settings/module/${module}/key/${key}`, null, { value, value_type, description }),
    toggleModule: (module: string, enabled: boolean) =>
      api.post(`/settings/module/${module}/toggle`, null, { enabled }),
    initDefaults: () => api.post('/settings/init-defaults')
  }
}
