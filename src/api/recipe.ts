import api from './index'

export interface RecipeIngredient {
  ingredientId: string
  ingredientName: string
  ratio: number
  unit: string
}

export interface Recipe {
  _id: string
  name: string
  category: string
  standardCost: number
  yield: number
  unit: string
  ingredients: RecipeIngredient[]
  history: { field: string; oldValue: string; newValue: string; changedAt: string }[]
  isSandbox: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedRecipes {
  items: Recipe[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const fetchRecipes = (params?: Record<string, unknown>) => api.get('/recipes', { params })
export const fetchRecipe = (id: string) => api.get(`/recipes/${id}`)
export const createRecipe = (data: Partial<Recipe>) => api.post('/recipes', data)
export const updateRecipe = (id: string, data: Partial<Recipe>) => api.put(`/recipes/${id}`, data)
export const deleteRecipe = (id: string) => api.delete(`/recipes/${id}`)
