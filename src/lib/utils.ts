import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import bcrypt from 'bcryptjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOrderNo(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DRM${timestamp}${random}`.toUpperCase();
}

export function generateQRCodeContent(ticketId: string): string {
  return `drama-ticket-${ticketId}-${Date.now()}`;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(num);
}

export function formatDate(date: Date | string, format: string = 'yyyy-MM-dd'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  if (requiredRoles.includes('SUPER_ADMIN') && userRole === 'SUPER_ADMIN') return true;
  if (requiredRoles.includes('COMMITTEE') && ['SUPER_ADMIN', 'COMMITTEE'].includes(userRole)) return true;
  if (requiredRoles.includes('DIRECTOR') && ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR'].includes(userRole)) return true;
  if (requiredRoles.includes('TICKET_STAFF') && ['SUPER_ADMIN', 'COMMITTEE', 'TICKET_STAFF'].includes(userRole)) return true;
  if (requiredRoles.includes('ACTOR') && ['SUPER_ADMIN', 'COMMITTEE', 'DIRECTOR', 'ACTOR'].includes(userRole)) return true;
  if (requiredRoles.includes('USER')) return true;
  return false;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
