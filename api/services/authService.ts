import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database.js';
import { JWT_SECRET } from '../middleware/auth.js';
import type { AuthUser } from '../../shared/types.js';

interface DbUser {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  name: string;
  phone: string;
  email: string;
  avatar_url?: string;
  coach_id?: number;
  member_id?: number;
  created_at: string;
  updated_at: string;
}

export function login(username: string, password: string): { user: AuthUser; token: string } | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined;
  if (!user) return null;

  const valid = bcrypt.compareSync(password, user.password_hash ?? '');
  if (!valid) return null;

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

  let coach = undefined;
  let member = undefined;
  if (user.coach_id) {
    coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(user.coach_id);
  }
  if (user.member_id) {
    member = db.prepare('SELECT * FROM members WHERE id = ?').get(user.member_id);
  }

  const { password_hash, ...userWithoutHash } = user;
  const authUser = { ...userWithoutHash, coach, member } as unknown as AuthUser;

  return { user: authUser, token };
}

export function getCurrentUser(userId: number): AuthUser | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as DbUser | undefined;
  if (!user) return null;

  let coach = undefined;
  let member = undefined;
  if (user.coach_id) {
    coach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(user.coach_id);
  }
  if (user.member_id) {
    member = db.prepare('SELECT * FROM members WHERE id = ?').get(user.member_id);
  }

  const { password_hash, ...userWithoutHash } = user;
  return { ...userWithoutHash, coach, member } as unknown as AuthUser;
}
