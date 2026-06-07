import type { UserRole } from '@/types';

export function shouldMask(role: UserRole): boolean {
  return role !== 'super_admin';
}

export function maskStudentId(studentId: string, role: UserRole): string {
  if (!shouldMask(role)) return studentId;
  if (!studentId || studentId.length < 7) return studentId;
  const prefix = studentId.slice(0, 3);
  const suffix = studentId.slice(-4);
  return `${prefix}****${suffix}`;
}

export function maskStudentName(name: string, role: UserRole): string {
  if (!shouldMask(role)) return name;
  if (!name || name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
}
