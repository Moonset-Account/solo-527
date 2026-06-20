import request from './request'

export interface DownloadDetail {
  _id: string
  transactionId: string
  activityTitle: string
  userName: string
  amount: number
  transactionSecurity: string
  repairTimeout: string
  lastOperation: string
  environment: 'sandbox' | 'production'
  createdAt: string
}

export interface DownloadListParams {
  environment?: 'sandbox' | 'production'
  page?: number
  pageSize?: number
}

export const getDownloadDetails = (params?: DownloadListParams) => {
  return request.get('/download-details', { params })
}

export const exportDownload = (params?: DownloadListParams) => {
  return request.get('/download-details/export', {
    params,
    responseType: 'blob'
  })
}
