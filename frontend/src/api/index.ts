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
  CalendarData,
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
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
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
      axiosInstance.post('/token/', data),

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
      property_id: string;
      start_date: string;
      end_date: string;
    }): Promise<AxiosResponse<CalendarData>> =>
      axiosInstance.get('/inventory/calendar/', { params }),

    checkAvailability: (params: {
      room_id: string;
      check_in_date: string;
      check_out_date: string;
    }): Promise<AxiosResponse<{ available: boolean; total_price: number }>> =>
      axiosInstance.get('/inventory/check_availability/', { params }),

    batchUpdate: (data: {
      room_ids: string[];
      start_date: string;
      end_date: string;
      status?: string;
      price?: number;
    }): Promise<AxiosResponse<Inventory[]>> =>
      axiosInstance.post('/inventory/calendar/batch_update/', data),

    update: (id: string, data: Partial<Inventory>): Promise<AxiosResponse<Inventory>> =>
      axiosInstance.put(`/inventory/${id}/`, data),

    conflicts: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<InventoryConflict>>> =>
      axiosInstance.get('/inventory/conflicts/', { params }),

    specialPricing: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<SpecialPricing>>> =>
        axiosInstance.get('/inventory/special-pricing/', { params }),

      create: (data: Partial<SpecialPricing>): Promise<AxiosResponse<SpecialPricing>> =>
        axiosInstance.post('/inventory/special-pricing/', data),

      update: (id: string, data: Partial<SpecialPricing>): Promise<AxiosResponse<SpecialPricing>> =>
        axiosInstance.put(`/inventory/special-pricing/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/inventory/special-pricing/${id}/`),
    },
  },

  orders: {
    list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<Order>>> =>
      axiosInstance.get('/orders/', { params }),

    get: (id: string): Promise<AxiosResponse<Order>> =>
      axiosInstance.get(`/orders/${id}/`),

    create: (data: BookingFormData): Promise<AxiosResponse<Order>> =>
      axiosInstance.post('/orders/', data),

    update: (id: string, data: Partial<Order>): Promise<AxiosResponse<Order>> =>
      axiosInstance.put(`/orders/${id}/`, data),

    updateStatus: (id: string, status: string): Promise<AxiosResponse<Order>> =>
      axiosInstance.post(`/orders/${id}/update_status/`, { status }),

    updateConversionStage: (id: string, stage: string): Promise<AxiosResponse<Order>> =>
      axiosInstance.post(`/orders/${id}/update_conversion_stage/`, { stage }),

    addPayment: (id: string, data: {
      amount: number;
      payment_method: string;
      transaction_id?: string;
    }): Promise<AxiosResponse<Order>> =>
      axiosInstance.post(`/orders/${id}/add_payment/`, data),

    getConversionFunnel: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<ConversionFunnelData[]>> =>
      axiosInstance.get('/orders/conversion_funnel/', { params }),
  },

  configuration: {
    tourRoutes: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<TourRoute>>> =>
        axiosInstance.get('/tour-routes/', { params }),

      get: (id: string): Promise<AxiosResponse<TourRoute>> =>
        axiosInstance.get(`/tour-routes/${id}/`),

      create: (data: Partial<TourRoute>): Promise<AxiosResponse<TourRoute>> =>
        axiosInstance.post('/tour-routes/', data),

      update: (id: string, data: Partial<TourRoute>): Promise<AxiosResponse<TourRoute>> =>
        axiosInstance.put(`/tour-routes/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/tour-routes/${id}/`),
    },

    cleaningTasks: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<CleaningTask>>> =>
        axiosInstance.get('/cleaning-tasks/', { params }),

      get: (id: string): Promise<AxiosResponse<CleaningTask>> =>
        axiosInstance.get(`/cleaning-tasks/${id}/`),

      create: (data: Partial<CleaningTask>): Promise<AxiosResponse<CleaningTask>> =>
        axiosInstance.post('/cleaning-tasks/', data),

      update: (id: string, data: Partial<CleaningTask>): Promise<AxiosResponse<CleaningTask>> =>
        axiosInstance.put(`/cleaning-tasks/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/cleaning-tasks/${id}/`),
    },

    itineraryVersions: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<ItineraryVersion>>> =>
        axiosInstance.get('/itinerary-versions/', { params }),

      get: (id: string): Promise<AxiosResponse<ItineraryVersion>> =>
        axiosInstance.get(`/itinerary-versions/${id}/`),

      compare: (id1: string, id2: string): Promise<AxiosResponse<Array<{
        field: string;
        old_value: unknown;
        new_value: unknown;
      }>>> =>
        axiosInstance.get(`/itinerary-versions/compare/`, { params: { id1, id2 } }),

      create: (data: Partial<ItineraryVersion>): Promise<AxiosResponse<ItineraryVersion>> =>
        axiosInstance.post('/itinerary-versions/', data),

      update: (id: string, data: Partial<ItineraryVersion>): Promise<AxiosResponse<ItineraryVersion>> =>
        axiosInstance.put(`/itinerary-versions/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/itinerary-versions/${id}/`),
    },
  },

  reminders: {
    rules: {
      list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<ReminderRule>>> =>
        axiosInstance.get('/reminder-rules/', { params }),

      get: (id: string): Promise<AxiosResponse<ReminderRule>> =>
        axiosInstance.get(`/reminder-rules/${id}/`),

      create: (data: Partial<ReminderRule>): Promise<AxiosResponse<ReminderRule>> =>
        axiosInstance.post('/reminder-rules/', data),

      update: (id: string, data: Partial<ReminderRule>): Promise<AxiosResponse<ReminderRule>> =>
        axiosInstance.put(`/reminder-rules/${id}/`, data),

      delete: (id: string): Promise<AxiosResponse<void>> =>
        axiosInstance.delete(`/reminder-rules/${id}/`),
    },

    list: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<Reminder>>> =>
      axiosInstance.get('/reminders/', { params }),

    get: (id: string): Promise<AxiosResponse<Reminder>> =>
      axiosInstance.get(`/reminders/${id}/`),

    acknowledge: (id: string): Promise<AxiosResponse<Reminder>> =>
      axiosInstance.post(`/reminders/${id}/acknowledge/`),

    resolve: (id: string): Promise<AxiosResponse<Reminder>> =>
      axiosInstance.post(`/reminders/${id}/resolve/`),

    getUnreadCount: (): Promise<AxiosResponse<{ count: number; overdue_count: number }>> =>
      axiosInstance.get('/reminders/unread_count/'),
  },

  audit: {
    logs: (params?: AxiosRequestConfig['params']): Promise<AxiosResponse<PaginatedResponse<AuditLog>>> =>
      axiosInstance.get('/audit-logs/', { params }),

    get: (id: string): Promise<AxiosResponse<AuditLog>> =>
      axiosInstance.get(`/audit-logs/${id}/`),
  },
};

export default api;
export { axiosInstance };
