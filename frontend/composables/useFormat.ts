import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export function useFormat() {
  function formatDate(value: any, format = 'YYYY-MM-DD') {
    if (!value) return '-'
    return dayjs(value).format(format)
  }

  function formatDateTime(value: any, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!value) return '-'
    return dayjs(value).format(format)
  }

  function formatNumber(value: any, decimals = 2) {
    if (value === null || value === undefined) return '-'
    return Number(value).toFixed(decimals)
  }

  function getStatusTagType(status: string): string {
    const map: Record<string, string> = {
      active: 'success',
      inactive: 'default',
      growing: 'success',
      harvested: 'info',
      finished: 'info',
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      cancelled: 'error',
      confirmed: 'success',
      rejected: 'error',
      warning: 'warning',
      danger: 'error',
      info: 'info',
      success: 'success',
      error: 'error',
      high: 'error',
      medium: 'warning',
      low: 'info',
    }
    return map[status] || 'default'
  }

  function getStatusText(status: string): string {
    const map: Record<string, string> = {
      active: '运行中',
      inactive: '已停用',
      growing: '生长中',
      harvested: '已采收',
      finished: '已完成',
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      cancelled: '已取消',
      confirmed: '已确认',
      rejected: '已拒绝',
      warning: '警告',
      danger: '危险',
      info: '提示',
      success: '成功',
      error: '错误',
      high: '高',
      medium: '中',
      low: '低',
    }
    return map[status] || status
  }

  function getAlertTypeText(type: string): string {
    const map: Record<string, string> = {
      temperature_high: '温度过高',
      temperature_low: '温度过低',
      humidity_high: '湿度过高',
      humidity_low: '湿度过低',
      soil_moisture_high: '土壤湿度过高',
      soil_moisture_low: '土壤湿度过低',
      co2_high: 'CO₂浓度过高',
      co2_low: 'CO₂浓度过低',
      light_high: '光照过强',
      light_low: '光照不足',
    }
    return map[type] || type
  }

  function getRecordTypeText(type: string): string {
    const map: Record<string, string> = {
      planting: '播种',
      transplanting: '移栽',
      watering: '浇水',
      fertilizing: '施肥',
      pest_control: '病虫害防治',
      pruning: '整枝打杈',
      harvesting: '采收',
      inspection: '巡查',
      environment: '环境调控',
      other: '其他',
    }
    return map[type] || type
  }

  return {
    formatDate,
    formatDateTime,
    formatNumber,
    getStatusTagType,
    getStatusText,
    getAlertTypeText,
    getRecordTypeText,
  }
}
