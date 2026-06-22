import api from './index'

export interface ProfitRecord {
  _id: string
  date: string
  batchId: string
  batchNo: string
  recipeId: string
  recipeName: string
  teamId: string
  teamName: string
  revenue: number
  cost: number
  margin: number
  marginRate: number
  materialCost: number
  supplyCost: number
  reworkCost: number
  quantity: number
  batchCount: number
  isSandbox: boolean
}

export interface ProfitSummary {
  totalRevenue: number
  totalCost: number
  totalMargin: number
  totalBatchCount: number
  marginRate: number
  costComposition: {
    materialCost: number
    supplyCost: number
    reworkCost: number
    materialRate: number
    supplyRate: number
    reworkRate: number
  }
}

export const fetchProfitSummary = (params?: Record<string, unknown>) => api.get('/profit/summary', { params })
export const fetchProfitByBatch = (params?: Record<string, unknown>) => api.get('/profit/by-batch', { params })
export const fetchProfitByRecipe = (params?: Record<string, unknown>) => api.get('/profit/by-recipe', { params })
export const fetchProfitByTeam = (params?: Record<string, unknown>) => api.get('/profit/by-team', { params })
export const fetchProfitTrend = (params?: Record<string, unknown>) => api.get('/profit/trend', { params })
