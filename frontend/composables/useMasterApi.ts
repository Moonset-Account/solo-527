import { useApi } from './useApi'

export const useMasterApi = () => {
  const api = useApi()

  return {
    getStores: () => api.get<Store[]>('/master/stores'),
    getStore: (id: number) => api.get<Store>(`/master/stores/${id}`),
    createStore: (data: Partial<Store>) => api.post<Store>('/master/stores', data),
    updateStore: (id: number, data: Partial<Store>) => api.put<Store>(`/master/stores/${id}`, data),

    getProducts: (params?: any) => api.get<Product[]>('/master/products', params),
    getProduct: (id: number) => api.get<Product>(`/master/products/${id}`),
    createProduct: (data: Partial<Product>) => api.post<Product>('/master/products', data),
    updateProduct: (id: number, data: Partial<Product>) => api.put<Product>(`/master/products/${id}`, data),

    getIngredients: (params?: any) => api.get<Ingredient[]>('/master/ingredients', params),
    getIngredient: (id: number) => api.get<Ingredient>(`/master/ingredients/${id}`),
    createIngredient: (data: Partial<Ingredient>) => api.post<Ingredient>('/master/ingredients', data),
    updateIngredient: (id: number, data: Partial<Ingredient>) => api.put<Ingredient>(`/master/ingredients/${id}`, data),

    getUsers: (params?: any) => api.get<User[]>('/master/users', params),
    createUser: (data: any) => api.post<User>('/master/users', data),
    updateUser: (id: number, data: any) => api.put<User>(`/master/users/${id}`, data)
  }
}
