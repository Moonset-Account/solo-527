export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export const formatCurrency = (num, symbol = '¥') => {
  if (num === null || num === undefined || isNaN(num)) return `${symbol}0.00`
  return `${symbol}${Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export const formatPercent = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0%'
  return `${(Number(num) * 100).toFixed(decimals)}%`
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
