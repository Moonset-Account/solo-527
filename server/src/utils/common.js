export function parseBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true' || val === '1';
  }
  return false;
}

export function parseNumber(val, defaultValue = 0) {
  const num = Number(val);
  return isNaN(num) ? defaultValue : num;
}

export function parsePagination(query) {
  const page = parseNumber(query.page, 1);
  const pageSize = parseNumber(query.pageSize, 10);
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}
