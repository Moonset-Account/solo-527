import request from './client';
import {
  DashboardStatsDto,
  Alert,
  EnvironmentData,
  HarvestBatch,
  ApplicationMaterial,
  MaterialStatsDto,
  Order,
  FulfillmentStatsDto,
  BatchOperation,
  BatchOperationResultDto,
  Threshold,
  Plot,
  User,
  Variety,
  PagedResult,
  BatchFilterDto,
  OrderFilterDto,
  BatchStatus,
  MaterialStatus,
  OrderStatus,
  Guid,
} from '@/types';

export const dashboardApi = {
  getStats: () => request<DashboardStatsDto>('/dashboard/stats'),
};

export const alertApi = {
  getActive: () => request<Alert[]>('/alert/active'),
  getByPlot: (plotId: Guid) => request<Alert[]>(`/alert/plot/${plotId}`),
  getByRange: (start: string, end: string) =>
    request<Alert[]>('/alert/range', { params: { start, end } }),
  acknowledge: (id: Guid, userId: Guid = '00000000-0000-0000-0000-000000000000') =>
    request.put<Alert>(`/alert/${id}/acknowledge`, null, { params: { userId } }),
  resolve: (id: Guid, userId: Guid = '00000000-0000-0000-0000-000000000000') =>
    request.put<Alert>(`/alert/${id}/resolve`, null, { params: { userId } }),
};

export const environmentApi = {
  getRecent: (plotId: Guid, minutes: number = 120) =>
    request.get<EnvironmentData[]>(`/environment/plot/${plotId}/recent`, { params: { minutes } }),
  getRange: (plotId: Guid, start: string, end: string) =>
    request.get<EnvironmentData[]>(`/environment/plot/${plotId}/range`, { params: { start, end } }),
  getLatestAll: () => request.get<Record<Guid, EnvironmentData>>('/environment/latest'),
};

export const batchApi = {
  getAll: (params?: { batchNumber?: string; plotId?: Guid; varietyId?: Guid; status?: BatchStatus }) =>
    request.get<HarvestBatch[]>('/harvestbatch', { params }),
  getPaged: (page: number, pageSize: number, filter?: BatchFilterDto) =>
    request.get<PagedResult<HarvestBatch>>('/harvestbatch/paged', { params: { page, pageSize, ...filter } }),
  getById: (id: Guid) => request.get<HarvestBatch>(`/harvestbatch/${id}`),
  getByNumber: (batchNumber: string) => request.get<HarvestBatch>(`/harvestbatch/number/${batchNumber}`),
  create: (data: Partial<HarvestBatch>) => request.post<HarvestBatch>('/harvestbatch', data),
  update: (id: Guid, data: Partial<HarvestBatch>) =>
    request.put<HarvestBatch>(`/harvestbatch/${id}`, data),
  remove: (id: Guid) => request.delete(`/harvestbatch/${id}`),
  getQrCodeUrl: (id: Guid) => `/api/harvestbatch/${id}/qrcode`,
};

export const materialApi = {
  getAll: (params?: { status?: MaterialStatus; materialType?: string }) =>
    request.get<ApplicationMaterial[]>('/material', { params }),
  getByBatch: (batchId: Guid) => request.get<ApplicationMaterial[]>(`/material/batch/${batchId}`),
  getStats: () => request.get<MaterialStatsDto>('/material/stats'),
  create: (data: Partial<ApplicationMaterial>) => request.post<ApplicationMaterial>('/material', data),
  update: (id: Guid, data: Partial<ApplicationMaterial>) =>
    request.put<ApplicationMaterial>(`/material/${id}`, data),
  remove: (id: Guid) => request.delete(`/material/${id}`),
  batchStatus: (ids: Guid[], newStatus: MaterialStatus, remark?: string) =>
    request.post<BatchOperationResultDto>('/material/batch/status', {
      ids,
      newStatus,
      operatorId: '00000000-0000-0000-0000-000000000000',
      remark,
    }),
};

export const orderApi = {
  getAll: (params?: { orderNumber?: string; status?: OrderStatus; batchId?: Guid }) =>
    request.get<Order[]>('/order', { params }),
  getPaged: (page: number, pageSize: number, filter?: OrderFilterDto) =>
    request.get<PagedResult<Order>>('/order/paged', { params: { page, pageSize, ...filter } }),
  getById: (id: Guid) => request.get<Order>(`/order/${id}`),
  getStats: () => request.get<FulfillmentStatsDto>('/order/stats'),
  create: (data: Partial<Order>) => request.post<Order>('/order', data),
  update: (id: Guid, data: Partial<Order>) => request.put<Order>(`/order/${id}`, data),
  remove: (id: Guid) => request.delete(`/order/${id}`),
  batchStatus: (ids: Guid[], newStatus: OrderStatus) =>
    request.post<BatchOperationResultDto>('/order/batch/status', {
      ids,
      newStatus,
      operatorId: '00000000-0000-0000-0000-000000000000',
    }),
};

export const operationApi = {
  getRecent: (count: number = 20) =>
    request.get<BatchOperation[]>('/batchoperation/recent', { params: { count } }),
  retry: (id: Guid) =>
    request.post<BatchOperationResultDto>(
      `/batchoperation/${id}/retry`,
      null,
      { params: { operatorId: '00000000-0000-0000-0000-000000000000' } }
    ),
};

export const thresholdApi = {
  getAll: () => request.get<Threshold[]>('/threshold'),
  getByPlot: (plotId?: Guid) =>
    request.get<Threshold[]>(plotId ? `/threshold/plot/${plotId}` : '/threshold/plot'),
  save: (data: Partial<Threshold>) => request.post<Threshold>('/threshold', data),
  remove: (id: Guid) => request.delete(`/threshold/${id}`),
};

export const plotApi = {
  getAll: () => request.get<Plot[]>('/plot'),
  getById: (id: Guid) => request.get<Plot>(`/plot/${id}`),
  create: (data: Partial<Plot>) => request.post<Plot>('/plot', data),
  update: (id: Guid, data: Partial<Plot>) => request.put<Plot>(`/plot/${id}`, data),
  remove: (id: Guid) => request.delete(`/plot/${id}`),
};

export const userApi = {
  getAll: () => request.get<User[]>('/user'),
  getById: (id: Guid) => request.get<User>(`/user/${id}`),
  getByRole: (role: string) => request.get<User[]>(`/user/role/${role}`),
};

export const varietyApi = {
  getAll: () => request.get<Variety[]>('/variety'),
  getById: (id: Guid) => request.get<Variety>(`/variety/${id}`),
  create: (data: Partial<Variety>) => request.post<Variety>('/variety', data),
  update: (id: Guid, data: Partial<Variety>) => request.put<Variety>(`/variety/${id}`, data),
  remove: (id: Guid) => request.delete(`/variety/${id}`),
};
