export const useApi = () => {
  const auth = useAuthStore()

  const headers = () => {
    const h: Record<string, string> = {}
    if (auth.token) h['Authorization'] = `Bearer ${auth.token}`
    return h
  }

  const request = async <T = any>(url: string, options: any = {}): Promise<any> => {
    try {
      const res = await $fetch<any>(url, {
        ...options,
        headers: { ...headers(), ...(options.headers || {}) }
      })
      if (res.code === 0) {
        return res
      }
      throw new Error(res.message || '请求失败')
    } catch (err: any) {
      if (err?.status === 401 || err?.statusCode === 401) {
        auth.logout()
      }
      throw err
    }
  }

  return {
    get: <T = any>(url: string, params?: any) => request<T>(url, { method: 'GET', query: params }),
    post: <T = any>(url: string, body?: any) => request<T>(url, { method: 'POST', body }),
    put: <T = any>(url: string, body?: any) => request<T>(url, { method: 'PUT', body }),
    delete: <T = any>(url: string, params?: any) => request<T>(url, { method: 'DELETE', query: params })
  }
}

export const formatDate = (date: any, fmt = 'YYYY-MM-DD') => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const map: Record<string, string> = {
    'YYYY': String(d.getFullYear()),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0')
  }
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, m => map[m])
}

export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    CHECKED_IN: 'bg-teal-100 text-teal-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ABNORMAL: 'bg-orange-100 text-orange-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    MAINTENANCE: 'bg-gray-100 text-gray-600',
    IN_USE: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-red-100 text-red-800',
    NORMAL: 'bg-green-100 text-green-800',
    FAULT_REPORTED: 'bg-red-100 text-red-800',
    REPAIRING: 'bg-yellow-100 text-yellow-800',
    REPAIRED: 'bg-blue-100 text-blue-800',
    SCRAPPED: 'bg-gray-100 text-gray-600',
    DRAFT: 'bg-gray-100 text-gray-600',
    REGISTERING: 'bg-green-100 text-green-800',
    UPCOMING: 'bg-blue-100 text-blue-800',
    ONGOING: 'bg-teal-100 text-teal-800',
    CHECKED_OUT: 'bg-gray-100 text-gray-800',
    LATE: 'bg-orange-100 text-orange-800',
    NO_SHOW: 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

export const statusText = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: '待确认', CONFIRMED: '已确认', PAID: '已支付',
    CHECKED_IN: '已签到', COMPLETED: '已完成', CANCELLED: '已取消',
    ABNORMAL: '异常结束', REFUNDED: '已退款', IN_USE: '使用中',
    AVAILABLE: '可用', BOOKED: '已预约', MAINTENANCE: '维护中', CLOSED: '关闭',
    NORMAL: '正常', FAULT_REPORTED: '待处理', REPAIRING: '维修中', REPAIRED: '已修复', SCRAPPED: '已报废',
    DRAFT: '草稿', REGISTERING: '报名中', UPCOMING: '即将开始', ONGOING: '进行中',
    CHECKED_OUT: '已签退', LATE: '迟到', NO_SHOW: '未到'
  }
  return map[status] || status
}
