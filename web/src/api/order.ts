import { get, post, put, del } from './request';
import type {
  Order,
  OrderStatus,
  OrderQueryParams,
  PaginatedResult,
  CreateOrderDto,
  UpdateOrderDto,
} from '@/types';

const API_PREFIX = '/api/orders';

export const getOrders = (params?: OrderQueryParams): Promise<PaginatedResult<Order>> => {
  return get<PaginatedResult<Order>>(API_PREFIX, params);
};

export const getOrder = (id: string): Promise<Order> => {
  return get<Order>(`${API_PREFIX}/${id}`);
};

export const createOrder = (data: CreateOrderDto, operator?: string): Promise<Order> => {
  return post<Order>(API_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateOrder = (id: string, data: UpdateOrderDto, operator?: string): Promise<Order> => {
  return put<Order>(`${API_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteOrder = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${API_PREFIX}/${id}`);
};

export const confirmOrder = (id: string, operator?: string): Promise<Order> => {
  return post<Order>(`${API_PREFIX}/${id}/confirm`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const startProduction = (id: string, operator?: string): Promise<Order> => {
  return post<Order>(`${API_PREFIX}/${id}/start-production`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const completeProduction = (id: string, operator?: string): Promise<Order> => {
  return post<Order>(`${API_PREFIX}/${id}/complete-production`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const qualityCheck = (id: string, operator?: string): Promise<Order> => {
  return post<Order>(`${API_PREFIX}/${id}/quality-check`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const completeOrder = (id: string, operator?: string): Promise<Order> => {
  return post<Order>(`${API_PREFIX}/${id}/complete`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const cancelOrder = (id: string, operator?: string): Promise<Order> => {
  return post<Order>(`${API_PREFIX}/${id}/cancel`, undefined, {
    params: { operator: operator || 'system' },
  });
};

interface StatusTransitionAction {
  key: string;
  label: string;
  danger?: boolean;
}

export const getStatusTransitionActions = (status: OrderStatus): StatusTransitionAction[] => {
  const transitions: Record<OrderStatus, StatusTransitionAction[]> = {
    pending: [{ key: 'confirm', label: '确认订单' }],
    confirmed: [{ key: 'startProduction', label: '开始生产' }],
    in_production: [{ key: 'completeProduction', label: '完成生产' }],
    quality_check: [{ key: 'complete', label: '完成订单' }],
    completed: [],
    cancelled: [],
  };
  const actions = transitions[status] || [];
  if (status !== 'completed' && status !== 'cancelled') {
    actions.push({ key: 'cancel', label: '取消订单', danger: true });
  }
  return actions;
};

export const executeStatusTransition = (id: string, action: string, operator?: string): Promise<Order> => {
  const actionMap: Record<string, (id: string, op?: string) => Promise<Order>> = {
    confirm: confirmOrder,
    startProduction: startProduction,
    completeProduction: completeProduction,
    qualityCheck: qualityCheck,
    complete: completeOrder,
    cancel: cancelOrder,
  };
  const handler = actionMap[action];
  if (!handler) {
    return Promise.reject(new Error(`Unknown action: ${action}`));
  }
  return handler(id, operator);
};

export const orderApi = {
  findAll: (params?: OrderQueryParams): Promise<PaginatedResult<Order>> => getOrders(params),
  findOne: (id: string): Promise<Order> => getOrder(id),
  create: (data: CreateOrderDto, operator?: string): Promise<Order> => createOrder(data, operator),
  update: (id: string, data: UpdateOrderDto, operator?: string): Promise<Order> => updateOrder(id, data, operator),
  remove: (id: string): Promise<{ success: boolean }> => deleteOrder(id),
};
