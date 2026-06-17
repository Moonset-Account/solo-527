import request from './request';

export const getMaintenances = (params?: any) => request.get('/maintenance', { params });
export const getMaintenance = (id: string) => request.get(`/maintenance/${id}`);
export const createMaintenance = (data: any) => request.post('/maintenance', data);
export const updateMaintenance = (id: string, data: any) => request.put(`/maintenance/${id}`, data);
export const updateMaintenanceConfigStatus = (id: string, configStatus: string) =>
  request.put(`/maintenance/${id}/config-status`, { configStatus });

export const getInspections = (params?: any) => request.get('/inspection', { params });
export const getInspection = (id: string) => request.get(`/inspection/${id}`);
export const createInspection = (data: any) => request.post('/inspection', data);
export const updateInspection = (id: string, data: any) => request.put(`/inspection/${id}`, data);
export const updateInspectionConfigStatus = (id: string, configStatus: string) =>
  request.put(`/inspection/${id}/config-status`, { configStatus });

export const getRoomPricings = (params?: any) => request.get('/room-pricing', { params });
export const getRoomPricingStatistics = () => request.get('/room-pricing/statistics');
export const getRoomPricing = (id: string) => request.get(`/room-pricing/${id}`);
export const createRoomPricing = (data: any) => request.post('/room-pricing', data);
export const updateRoomPricing = (id: string, data: any) => request.put(`/room-pricing/${id}`, data);
export const updateRoomPricingConfigStatus = (id: string, configStatus: string) =>
  request.put(`/room-pricing/${id}/config-status`, { configStatus });

export const getAccessExceptions = (params?: any) => request.get('/access-exceptions', { params });
export const getAccessException = (id: string) => request.get(`/access-exceptions/${id}`);
export const getExceptionStatistics = () => request.get('/access-exceptions/statistics');
export const createAccessException = (data: any) => request.post('/access-exceptions', data);
export const updateAccessException = (id: string, data: any) => request.put(`/access-exceptions/${id}`, data);
export const updateExceptionConfigStatus = (id: string, configStatus: string) =>
  request.put(`/access-exceptions/${id}/config-status`, { configStatus });

export const getConfigs = (params?: any) => request.get('/config', { params });
export const getConfigByCategory = (category: string, status?: string) =>
  request.get(`/config/category/${category}`, { params: { status } });
export const createConfig = (data: any) => request.post('/config', data);
export const updateConfig = (id: string, data: any) => request.put(`/config/${id}`, data);
export const updateConfigStatus = (id: string, status: string) =>
  request.put(`/config/${id}/status`, { status });
