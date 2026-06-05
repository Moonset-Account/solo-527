import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db/schema';
import { Role, User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'freelance-management-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

export interface AuthPayload {
  userId: number;
  email: string;
  role: Role;
  name: string;
}

export function generateToken(user: Omit<User, 'password_hash'>): string {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function findUserByEmail(email: string): (Omit<User, 'password_hash'> & { password_hash: string }) | null {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return user as (Omit<User, 'password_hash'> & { password_hash: string }) | null;
}

export function findUserById(id: number): Omit<User, 'password_hash'> | null {
  const user = db.prepare('SELECT id, email, name, role, avatar_url, phone, created_at, updated_at FROM users WHERE id = ?').get(id);
  return user as Omit<User, 'password_hash'> | null;
}

export function requireRoles(allowedRoles: Role[]) {
  return (user: AuthPayload | null): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };
}

export function canAccessProject(user: AuthPayload, projectId: number): boolean {
  if (user.role === Role.ADMIN || user.role === Role.DESIGNER) {
    return true;
  }

  const project = db.prepare('SELECT p.*, c.user_id as client_user_id FROM projects p JOIN clients c ON p.client_id = c.id WHERE p.id = ?').get(projectId) as any;
  
  if (!project) return false;
  
  return project.client_user_id === user.userId;
}

export function canAccessClient(user: AuthPayload, clientId: number): boolean {
  if (user.role === Role.ADMIN || user.role === Role.DESIGNER) {
    return true;
  }

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) as any;
  if (!client) return false;
  
  return client.user_id === user.userId;
}

export function sanitizeUser(user: any): Omit<User, 'password_hash'> {
  const { password_hash, ...sanitized } = user;
  return sanitized;
}
