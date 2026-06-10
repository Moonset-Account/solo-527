import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  Property,
  Room,
  Inventory,
  InventoryConflict,
  SpecialPricing,
  Order,
  ConversionFunnelData,
  BookingFormData,
  TourRoute,
  CleaningTask,
  ItineraryVersion,
  ReminderRule,
  Reminder,
  AuditLog,
  PaginatedResponse,
} from '@/types';

const API_BASE_URL = '/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axiosInstance(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const api = {
  auth: {
    login: (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> =>
      axiosInstance.post('/auth/login/', data),

    logout: (): void => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },

    getCurrentUser: (): Promise<AxiosResponse<User>> =>
      axiosInstance.get('/users/me/'),
  },

  properties: {
    list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<Property>>> =>
      axiosInstance.get('/properties/', { params }),

    get: (id: string): Promise<AxiosResponse<Property>> =>
      axiosInstance.get(`/properties/${id}/`),

    create: (data: Partial<Property>): Promise<AxiosResponse<Property>> =>
      axiosInstance.post('/properties/', data),

    update: (id: string, data: Partial<Property>): Promise<AxiosResponse<Property>> =>
      axiosInstance.put(`/properties/${id}/`, data),

    delete: (id: string): Promise<AxiosResponse<void>> =>
      axiosInstance.delete(`/properties/${id}/`),
  },

  rooms: {
    list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<Room>>> =>
      axiosInstance.get('/rooms/', { params }),

    get: (id: string): Promise<AxiosResponse<Room>> =>
      axiosInstance.get(`/rooms/${id}/`),

    create: (data: Partial<Room>): Promise<AxiosResponse<Room>> =>
      axiosInstance.post('/rooms/', data),

    update: (id: string, data: Partial<Room>): Promise<AxiosResponse<Room>> =>
      axiosInstance.put(`/rooms/${id}/`, data),

    delete: (id: string): Promise<AxiosResponse<void>> =>
      axiosInstance.delete(`/rooms/${id}/`),
  },

  inventory: {
    list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<Inventory>>> =>
      axiosInstance.get('/inventory/', { params }),

    getCalendar: (params: {
      room_id: string;
      start_date: string;
      end_date: string;
    }): Promise<AxiosResponse<Inventory[]>> =>
      axiosInstance.get('/inventory/calendar/', { params }),

    checkAvailability: (params: {
      room_id: string;
      check_in: string;
      check_out: string;
    }): Promise<AxiosResponse<{
      available: boolean;
      reason?: string;
      conflict_date?: string;
      nights?: number;
      total_price: number;
    }>> =>
      axiosInstance.get('/inventory/calendar/check_availability/', { params }),

    batchUpdate: (data: {
      room_id: string;
      start_date: string;
      end_date: string;
      status?: string;
      price?: number;
      is_locked?: boolean;
    }): Promise<AxiosResponse<{
      updated: number;
      conflicts: InventoryConflict[];
      has_conflicts: boolean;
    }>> =>
      axiosInstance.put('/inventory/calendar/batch_update/', data),

    update: (id: string, data: Partial<Inventory>): Promise<AxiosResponse<Inventory>> =>
      axiosInstance.put(`/inventory/${id}/`, data),

    conflicts: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<InventoryConflict>>> =>
      axiosInstance.get('/inventory/conflicts/', { params }),

    specialPricing: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<SpecialPricing>>> =>
        axiosInstance.get('/inventory/pricing/', { params }),

      create: (data: Partial<SpecialPricing>): Promise<AxiosResponse<SpecialPricing>> =>
        axiosInstance.post('/inventory/pricing/', data),

      update: (id: string, data: Partial<SpecialPricing>): Promise<AxiosResponse<SpecialPricing>> =>
        axiosInstance.put(`/inventory/pricing/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/inventory/pricing/${id}/`),
    },
  },

  orders: {
    list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<Order>>> =>
      axiosInstance.get('/orders/', { params }),

    get: (id: string): Promise<AxiosResponse<Order>> =>
      axiosInstance.get(`/orders/${id}/`),

    create: (data: BookingFormData): Promise<AxiosResponse<Order>> =>
      axiosInstance.post('/orders/book/', data),

    update: (id: string, data: Partial<Order>): Promise<AxiosResponse<Order>> =>
      axiosInstance.put(`/orders/${id}/`, data),

    updateStatus: (id: string, status: string, remarks?: string): Promise<AxiosResponse<Order>> =>
      axiosInstance.post(`/orders/${id}/update_status/`, { status, remarks }),

    updateConversionStage: (id: string, stage: string, remarks?: string): Promise<AxiosResponse<Order>> =>
      axiosInstance.post(`/orders/${id}/update_conversion_stage/`, { stage, remarks }),

    addPayment: (id: string, data: {
      amount: number;
      method: string;
      transaction_no?: string;
      remarks?: string;
    }): Promise<AxiosResponse<Order>> =>
      axiosInstance.post(`/orders/${id}/add_payment/`, data),

    getConversionFunnel: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<ConversionFunnelData[]>> =>
      axiosInstance.get('/orders/conversion_funnel/', { params }),

    getStats: (): Promise<AxiosResponse<{
      total_orders: number;
      today_orders: number;
      pending_orders: number;
      confirmed_orders: number;
      checked_in_orders: number;
      total_revenue: number;
      today_revenue: number;
    }>> =>
      axiosInstance.get('/orders/stats/'),
  },

  configuration: {
    tourRoutes: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<TourRoute>>> =>
        axiosInstance.get('/configuration/routes/', { params }),

      get: (id: string): Promise<AxiosResponse<TourRoute>> =>
        axiosInstance.get(`/configuration/routes/${id}/`),

      create: (data: Partial<TourRoute>): Promise<AxiosResponse<TourRoute>> =>
        axiosInstance.post('/configuration/routes/', data),

      update: (id: string, data: Partial<TourRoute>): Promise<AxiosResponse<TourRoute>> =>
        axiosInstance.put(`/configuration/routes/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/configuration/routes/${id}/`),
    },

    cleaningTasks: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<CleaningTask>>> =>
        axiosInstance.get('/configuration/cleaning/', { params }),

      get: (id: string): Promise<AxiosResponse<CleaningTask>> =>
        axiosInstance.get(`/configuration/cleaning/${id}/`),

      create: (data: Partial<CleaningTask>): Promise<AxiosResponse<CleaningTask>> =>
        axiosInstance.post('/configuration/cleaning/', data),

      update: (id: string, data: Partial<CleaningTask>): Promise<AxiosResponse<CleaningTask>> =>
        axiosInstance.put(`/configuration/cleaning/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/configuration/cleaning/${id}/`),
    },

    itineraryVersions: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<ItineraryVersion>>> =>
        axiosInstance.get('/configuration/itineraries/', { params }),

      get: (id: string): Promise<AxiosResponse<ItineraryVersion>> =>
        axiosInstance.get(`/configuration/itineraries/${id}/`),

      compare: (id1: string, id2: string): Promise<AxiosResponse<Array<{
        field: string;
        old_value: unknown;
        new_value: unknown;
      }>>> =>
        axiosInstance.get(`/configuration/itineraries/compare/`, { params: { id1, id2 } }),

      create: (data: Partial<ItineraryVersion>): Promise<AxiosResponse<ItineraryVersion>> =>
        axiosInstance.post('/configuration/itineraries/', data),

      update: (id: string, data: Partial<ItineraryVersion>): Promise<AxiosResponse<ItineraryVersion>> =>
        axiosInstance.put(`/configuration/itineraries/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/configuration/itineraries/${id}/`),
    },
  },

  reminders: {
    rules: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<ReminderRule>>> =>
        axiosInstance.get('/reminders/rules/', { params }),

      get: (id: string): Promise<AxiosResponse<ReminderRule>> =>
        axiosInstance.get(`/reminders/rules/${id}/`),

      create: (data: Partial<ReminderRule>): Promise<AxiosResponse<ReminderRule>> =>
        axiosInstance.post('/reminders/rules/', data),

      update: (id: string, data: Partial<ReminderRule>): Promise<AxiosResponse<ReminderRule>> =>
        axiosInstance.put(`/reminders/rules/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/reminders/rules/${id}/`),

      activate: (id: string): Promise<AxiosResponse<{ status: string }>> =>
        axiosInstance.post(`/reminders/rules/${id}/activate/`),

      deactivate: (id: string): Promise<AxiosResponse<{ status: string }>> =>
        axiosInstance.post(`/reminders/rules/${id}/deactivate/`),
    },

    list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<Reminder>>> =>
      axiosInstance.get('/reminders/', { params }),

    get: (id: string): Promise<AxiosResponse<Reminder>> =>
      axiosInstance.get(`/reminders/${id}/`),

    handle: (id: string, data: { status: string; notes?: string }): Promise<AxiosResponse<Reminder>> =>
      axiosInstance.post(`/reminders/${id}/handle/`, data),

    escalate: (id: string): Promise<AxiosResponse<Reminder>> =>
      axiosInstance.post(`/reminders/${id}/escalate/`),

    getStats: (): Promise<AxiosResponse<{
      total_pending: number;
      total_overdue: number;
      by_level: {
        [key: number]: {
          pending: number;
          overdue: number;
        };
      };
    }>> =>
      axiosInstance.get('/reminders/stats/'),

    batchHandle: (data: { ids: string[]; status: string; notes?: string }): Promise<AxiosResponse<{ updated: number }>> =>
      axiosInstance.post('/reminders/batch_handle/', data),
  },

  audit: {
    logs: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<AuditLog>>> =>
      axiosInstance.get('/audit/logs/', { params }),

    get: (id: string): Promise<AxiosResponse<AuditLog>> =>
      axiosInstance.get(`/audit/logs/${id}/`),

    getDiff: (id: string): Promise<AxiosResponse<{
      log: AuditLog;
      diffs: Array<{
        field: string;
        old_value: unknown;
        new_value: unknown;
      }>;
    }>> =>
      axiosInstance.get(`/audit/logs/${id}/diff/`),
  },
};

export default api;
export { axiosInstance };