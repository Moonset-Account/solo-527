import { get, post, put, del } from './request';
import type {
  Customer,
  PriceList,
  PaginatedResult,
  PaginationParams,
} from '@/types';

const CUSTOMERS_PREFIX = '/api/customers';
const PRICE_LISTS_PREFIX = '/api/price-lists';

export const getCustomers = (params?: PaginationParams): Promise<PaginatedResult<Customer>> => {
  return get<PaginatedResult<Customer>>(CUSTOMERS_PREFIX, params);
};

export const getCustomer = (id: string): Promise<Customer> => {
  return get<Customer>(`${CUSTOMERS_PREFIX}/${id}`);
};

export const createCustomer = (
  data: Partial<Customer>,
  operator?: string
): Promise<Customer> => {
  return post<Customer>(CUSTOMERS_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateCustomer = (
  id: string,
  data: Partial<Customer>,
  operator?: string
): Promise<Customer> => {
  return put<Customer>(`${CUSTOMERS_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteCustomer = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${CUSTOMERS_PREFIX}/${id}`);
};

export const getCustomerPriceLists = (
  customerId: string,
  params?: PaginationParams
): Promise<PaginatedResult<PriceList>> => {
  return get<PaginatedResult<PriceList>>(`${CUSTOMERS_PREFIX}/${customerId}/price-lists`, params);
};

export const createPriceList = (
  data: Partial<PriceList>,
  operator?: string
): Promise<PriceList> => {
  return post<PriceList>(PRICE_LISTS_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updatePriceList = (
  id: string,
  data: Partial<PriceList>,
  operator?: string
): Promise<PriceList> => {
  return put<PriceList>(`${PRICE_LISTS_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deletePriceList = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${PRICE_LISTS_PREFIX}/${id}`);
};

export const customerApi = {
  findAll: (params?: PaginationParams): Promise<PaginatedResult<Customer>> => getCustomers(params),
  findOne: (id: string): Promise<Customer> => getCustomer(id),
  create: (data: Partial<Customer>, operator?: string): Promise<Customer> => createCustomer(data, operator),
  update: (id: string, data: Partial<Customer>, operator?: string): Promise<Customer> => updateCustomer(id, data, operator),
  remove: (id: string): Promise<{ success: boolean }> => deleteCustomer(id),
};
