import request from './request'

export interface LastOperation {
  operator: string
  operatedAt: string
}

export interface DownloadDetail {
  _id: string
  transactionSecurity: string
  repairTimeout: string
  lastOperation: LastOperation
  environment: 'sandbox' | 'production'
  data?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface DownloadListParams {
  environment?: 'sandbox' | 'production'
}

export const getDownloadDetails = (params?: DownloadListParams) => {
  return request.get('/download/details', { params })
}

export const exportDownload = (params?: DownloadListParams) => {
  return request.get('/download/export', {
    params,
    responseType: 'blob'
  })
}
