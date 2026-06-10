import { create } from 'zustand';
import api from '@/api';
import type { Order, ConversionFunnelData, BookingFormData } from '@/types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  conversionFunnel: ConversionFunnelData[];
  isLoading: boolean;
  error: string | null;

  fetchOrders: (params?: Record<string, unknown>) => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  fetchConversionFunnel: (params?: Record<string, unknown>) => Promise<void>;
  createOrder: (data: BookingFormData) => Promise<Order>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  updateConversionStage: (id: string, stage: string) => Promise<void>;
  addPayment: (id: string, data: {
    amount: number;
    payment_method: string;
    transaction_id?: string;
  }) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  conversionFunnel: [],
  isLoading: false,
  error: null,

  fetchOrders: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.orders.list(params);
      set({ orders: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取订单列表失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchOrder: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await api.orders.get(id);
      set({ currentOrder: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取订单详情失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchConversionFunnel: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.orders.getConversionFunnel(params);
      set({ conversionFunnel: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取转化漏斗数据失败';
      set({ error: message, isLoading: false });
    }
  },

  createOrder: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.orders.create(data);
      set((state) => ({
        orders: [response.data, ...state.orders],
        isLoading: false,
      }));
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '创建订单失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateOrderStatus: async (id: string, status: string) => {
    try {
      const response = await api.orders.updateStatus(id, status);
      const orders = get().orders.map((o) => (o.id === id ? response.data : o));
      set({ orders, currentOrder: response.data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新订单状态失败';
      set({ error: message });
      throw error;
    }
  },

  updateConversionStage: async (id: string, stage: string) => {
    try {
      const response = await api.orders.updateConversionStage(id, stage);
      const orders = get().orders.map((o) => (o.id === id ? response.data : o));
      set({ orders, currentOrder: response.data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新转化阶段失败';
      set({ error: message });
      throw error;
    }
  },

  addPayment: async (id: string, data) => {
    try {
      const response = await api.orders.addPayment(id, data);
      const orders = get().orders.map((o) => (o.id === id ? response.data : o));
      set({ orders, currentOrder: response.data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '添加支付记录失败';
      set({ error: message });
      throw error;
    }
  },
}));
