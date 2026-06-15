import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import numeral from 'numeral';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatTime = (date, format = 'HH:mm:ss') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '-';
  return `${formatTime(startTime, 'HH:mm')} - ${formatTime(endTime, 'HH:mm')}`;
};

export const formatRelativeTime = (date) => {
  if (!date) return '-';
  return dayjs(date).fromNow();
};

export const formatMonth = (date, format = 'YYYY-MM') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatYear = (date, format = 'YYYY') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatWeekday = (date) => {
  if (!date) return '-';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[dayjs(date).day()];
};

export const formatMoney = (amount, currency = '¥', decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  const formatted = numeral(amount).format(`0,0.${'0'.repeat(decimals)}`);
  return `${currency}${formatted}`;
};

export const formatMoneyPlain = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return numeral(amount).format(`0,0.${'0'.repeat(decimals)}`);
};

export const formatMoneyWithoutDecimals = (amount, currency = '¥') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  const formatted = numeral(amount).format('0,0');
  return `${currency}${formatted}`;
};

export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return numeral(value).format(`0.${'0'.repeat(decimals)}%`);
};

export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return numeral(value).format(`0,0.${'0'.repeat(decimals)}`);
};

export const formatThousand = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  if (Math.abs(value) >= 10000) {
    return `${numeral(value / 10000).format('0,0.0')}万`;
  }
  return numeral(value).format('0,0');
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  return phone;
};

export const formatIdCard = (idCard) => {
  if (!idCard) return '-';
  if (idCard.length === 18) {
    return `${idCard.slice(0, 6)}********${idCard.slice(-4)}`;
  }
  return idCard;
};

export const formatPlateNumber = (plate) => {
  if (!plate) return '-';
  return plate.toUpperCase();
};

export const formatStatus = (status, statusMap) => {
  if (status === null || status === undefined) return '-';
  return statusMap[status] || status;
};

export const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  }
  return `${mins}分钟`;
};

export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const getDateRange = (type) => {
  const today = dayjs();
  switch (type) {
    case 'today':
      return [today.startOf('day').toDate(), today.endOf('day').toDate()];
    case 'yesterday':
      return [
        today.subtract(1, 'day').startOf('day').toDate(),
        today.subtract(1, 'day').endOf('day').toDate(),
      ];
    case 'week':
      return [today.startOf('week').toDate(), today.endOf('week').toDate()];
    case 'month':
      return [today.startOf('month').toDate(), today.endOf('month').toDate()];
    case 'quarter':
      return [today.startOf('quarter').toDate(), today.endOf('quarter').toDate()];
    case 'year':
      return [today.startOf('year').toDate(), today.endOf('year').toDate()];
    default:
      return [today.startOf('day').toDate(), today.endOf('day').toDate()];
  }
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatTimeRange,
  formatRelativeTime,
  formatMonth,
  formatYear,
  formatWeekday,
  formatMoney,
  formatMoneyPlain,
  formatMoneyWithoutDecimals,
  formatPercent,
  formatNumber,
  formatThousand,
  formatPhone,
  formatIdCard,
  formatPlateNumber,
  formatStatus,
  formatDuration,
  formatFileSize,
  truncateText,
  getDateRange,
};
