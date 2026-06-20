export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  total?: number
  successCount?: number
  failCount?: number
  failedItems?: any[]
}

export const successResponse = <T>(data?: T, message: string = 'success', total?: number): ApiResponse<T> => {
  return {
    code: 0,
    message,
    data,
    total
  }
}

export const errorResponse = (message: string, code: number = 1): ApiResponse => {
  return {
    code,
    message
  }
}

export const batchResponse = (
  successCount: number,
  failCount: number,
  failedItems?: any[],
  data?: any,
  message: string = '批量操作完成'
): ApiResponse => {
  return {
    code: 0,
    message,
    data,
    successCount,
    failCount,
    failedItems
  }
}
