import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

export const fmtMoney = (v) => {
  const n = Number(v);
  if (isNaN(n)) return '-';
  return '¥' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const fmtNum = (v, dec = 0) => {
  const n = Number(v);
  if (isNaN(n)) return '-';
  return n.toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

export const fmtPct = (v, dec = 1) => {
  const n = Number(v);
  if (isNaN(n)) return '-';
  return n.toFixed(dec) + '%';
};

export const fmtDate = (v, pattern = 'YYYY-MM-DD') => (v ? dayjs(v).format(pattern) : '-');
export const fmtDateTime = (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-');
export const fmtDateTimeSec = (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-');

export const fromNow = (v) => (v ? dayjs(v).fromNow() : '-');

export const fmtDuration = (ms) => {
  if (!ms) return '-';
  if (ms < 0) return '未完成';
  const d = dayjs.duration(Number(ms));
  const days = Math.floor(d.asDays());
  const h = d.hours();
  const m = d.minutes();
  if (days > 0) return `${days}天${h}小时${m}分`;
  if (h > 0) return `${h}小时${m}分`;
  return `${m}分钟`;
};

export const daysUntil = (date) => {
  if (!date) return null;
  return dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
};

export const expiryTag = (date, warningDays = 7) => {
  const days = daysUntil(date);
  if (days === null) return { label: '-', cls: '' };
  if (days < 0) return { label: `已过期${-days}天`, cls: 'red', color: 'red', status: 'error' };
  if (days === 0) return { label: '今日到期', cls: 'red', color: 'red', status: 'error' };
  if (days <= warningDays) return { label: `${days}天到期`, cls: 'orange', color: 'orange', status: 'warning' };
  if (days <= warningDays * 2) return { label: `${days}天到期`, cls: 'orange', color: 'warning', status: 'warning' };
  return { label: `剩${days}天`, cls: 'green', color: 'green', status: 'success' };
};

export const stockStatus = (available, min) => {
  const a = Number(available) || 0;
  const m = Number(min) || 0;
  if (a <= 0) return { label: '断货', color: 'red' };
  if (a <= m * 0.5) return { label: '紧急', color: 'red' };
  if (a <= m) return { label: '偏低', color: 'orange' };
  return { label: '正常', color: 'green' };
};

export const parsePagination = (res) => {
  return {
    current: res?.pagination?.page || 1,
    pageSize: res?.pagination?.pageSize || 20,
    total: res?.pagination?.total || 0,
    showTotal: (t) => `共 ${t} 条`,
    showSizeChanger: true,
    showQuickJumper: true,
  };
};

export const priorityLabel = (p) => {
  const map = { 1: { t: '低', c: 'blue' }, 2: { t: '中', c: 'orange' }, 3: { t: '高', c: 'red' }, 4: { t: '紧急', c: 'magenta' } };
  return map[p] || { t: '-', c: 'default' };
};

export const levelLabel = (lv) => {
  const stars = '★'.repeat(Number(lv) || 0) + '☆'.repeat(Math.max(0, 5 - (Number(lv) || 0)));
  return stars;
};
