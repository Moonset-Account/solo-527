
import axios from 'axios';
import {
  OrderDto,
  OrderDetailDto,
  CreateOrderDto,
  StoreDto,
  StoreSummaryDto,
  DeliveryReminderDto,
  ProductionProgressDto,
  UpdateProductionProgressDto,
  EquipmentDto,
  QualityInspectionDto,
  CreateQualityInspectionDto,
  QualityIssueDto,
  CreateQualityIssueDto,
  BatchProcessRequest,
  BatchProcessResult,
  BatchOperationItemDto,
  BatchOperationType,
  OrderStatus,
  EquipmentStatus
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const orderApi = {
  getList: (params?: {
    storeId?: number;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
    searchKeyword?: string;
    pageIndex?: number;
    pageSize?: number;
  }) => api.get<OrderDto[]>('/orders', { params }),

  getDetail: (id: number) => api.get<OrderDetailDto>(`/orders/${id}`),

  create: (data: CreateOrderDto) => api.post<OrderDto>('/orders', data),

  updateProgress: (data: UpdateProductionProgressDto) =>
    api.put<ProductionProgressDto>('/orders/progress', data)
};

export const storeApi = {
  getList: () => api.get<StoreDto[]>('/stores')
};

export const summaryApi = {
  getStoreSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<StoreSummaryDto[]>('/summary/stores', { params }),

  getDeliveryReminders: (daysAhead?: number) =>
    api.get<DeliveryReminderDto[]>('/summary/delivery-reminders', {
      params: { daysAhead }
    })
};

export const equipmentApi = {
  getList: (params?: { status?: EquipmentStatus; type?: string }) =>
    api.get<EquipmentDto[]>('/equipment', { params })
};

export const qualityApi = {
  createInspection: (data: CreateQualityInspectionDto) =>
    api.post<QualityInspectionDto>('/quality/inspection', data),

  createIssue: (data: CreateQualityIssueDto) =>
    api.post<QualityIssueDto>('/quality/issue', data)
};

export const batchApi = {
  execute: (data: BatchProcessRequest) =>
    api.post<BatchProcessResult>('/batch/execute', data),

  retry: (batchItemId: number, operationType: BatchOperationType) =>
    api.post<BatchOperationItemDto>(`/batch/retry/${batchItemId}`, null, {
      params: { operationType }
    })
};

export const exportApi = {
  exportOrders: (params?: {
    storeId?: number;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
    format?: string;
  }) =>
    api.get('/export/orders', {
      params,
      responseType: 'blob'
    })
};

export default api;
