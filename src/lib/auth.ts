import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface JWTPayload {
  userId: string;
  username: string;
  roles: string[];
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  if (phone.length < 7) return phone.replace(/./g, '*');
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 2) return name[0] + '***@' + domain;
  return name[0] + '***' + name[name.length - 1] + '@' + domain;
}

export function sanitizeStudentData<T extends { phone?: string | null; email?: string | null }>(
  student: T,
  canViewContact: boolean
): T {
  if (canViewContact) return student;
  return {
    ...student,
    phone: maskPhone(student.phone),
    email: maskEmail(student.email),
  };
}

export function checkPermission(
  userRoles: string[],
  requiredRoles: string[]
): boolean {
  if (userRoles.includes('admin')) return true;
  return requiredRoles.some((role) => userRoles.includes(role));
}

export const ROLES = {
  ADMIN: 'admin',
  DEAN: 'dean',
  HEAD_TEACHER: 'head_teacher',
  TEACHER: 'teacher',
};

export const PERMISSIONS = {
  VIEW_ALL_CLASSES: 'view_all_classes',
  VIEW_CLASS_DATA: 'view_class_data',
  EDIT_CLASS_DATA: 'edit_class_data',
  EXPORT_DATA: 'export_data',
  VIEW_CONTACT_INFO: 'view_contact_info',
  MANAGE_USERS: 'manage_users',
  IMPORT_DATA: 'import_data',
};
