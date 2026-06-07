import type { MaskType } from '@/types'

export const DEFAULT_MIN_SAMPLE_SIZE = 10

export function maskName(name: string): string {
  if (!name || name.length === 0) return '***'
  if (name.length === 1) return name + '*'
  if (name.length === 2) return name.charAt(0) + '*'
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return '***'
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4)
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) return '***'
  return idCard.substring(0, 3) + '***********' + idCard.substring(idCard.length - 4)
}

export function maskValue(value: string | number, type: MaskType, pattern?: string): string {
  if (value === null || value === undefined) return '***'

  switch (type) {
    case 'full':
      return '***'
    case 'partial':
      if (typeof value === 'number') return '***'
      if (pattern === 'name') return maskName(value)
      if (pattern === 'phone') return maskPhone(value)
      if (pattern === 'idcard') return maskIdCard(value)
      return '***'
    case 'range':
      return formatRangeValue(value)
    case 'aggregate-only':
      return '仅支持聚合统计'
    default:
      return '***'
  }
}

export function formatRangeValue(value: string | number): string {
  const num = typeof value === 'number' ? value : parseInt(value, 10)
  if (isNaN(num)) return '0-10'
  if (num < 10) return '0-10'
  if (num < 20) return '10-20'
  if (num < 50) return '20-50'
  if (num < 100) return '50-100'
  return '100+'
}

export function isLowSample(sampleSize: number, minSize: number = DEFAULT_MIN_SAMPLE_SIZE): boolean {
  return sampleSize < minSize
}

export function formatSampleSize(sampleSize: number, minSize: number = DEFAULT_MIN_SAMPLE_SIZE): string {
  if (isLowSample(sampleSize, minSize)) {
    return `n<${minSize}`
  }
  return `n=${sampleSize}`
}

export function obfuscateLowSampleValue(
  value: number,
  sampleSize: number,
  minSize: number = DEFAULT_MIN_SAMPLE_SIZE,
  unit: string = ''
): string {
  if (isLowSample(sampleSize, minSize)) {
    return '样本不足'
  }
  return `${value}${unit}`
}
