export function desensitizePlate(plate: string): string {
  if (!plate || plate.length < 4) return plate || '-';
  return plate.slice(0, 3) + '·' + plate.slice(3, 4) + '***';
}

export function desensitizeIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) return idCard || '-';
  return idCard.slice(0, 3) + '***********' + idCard.slice(-4);
}

export function desensitizeName(name: string): string {
  if (!name || name.length <= 1) return name || '-';
  return '*' + name.slice(1);
}

export function desensitizePhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || '-';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  if (num >= 1000) return num.toLocaleString('zh-CN');
  return num.toString();
}
