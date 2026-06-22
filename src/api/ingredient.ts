import api from './index'

export interface Ingredient {
  _id: string
  name: string
  category: string
  unit: string
  costPerUnit: number
  currentStock: number
  minStock: number
  costHistory: { cost: number; date: string }[]
  isSandbox: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedIngredients {
  items: Ingredient[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const fetchIngredients = (params?: Record<string, unknown>) => api.get('/ingredients', { params })
export const fetchIngredient = (id: string) => api.get(`/ingredients/${id}`)
export const createIngredient = (data: Partial<Ingredient>) => api.post('/ingredients', data)
export const updateIngredient = (id: string, data: Partial<Ingredient>) => api.put(`/ingredients/${id}`, data)
export const deleteIngredient = (id: string) => api.delete(`/ingredients/${id}`)
