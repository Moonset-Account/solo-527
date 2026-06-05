import { db } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'museum-study-platform-secret-2024';

export function register(email: string, username: string, password: string, name: string, phone: string, role: string) {
  if (!['school_contact', 'parent'].includes(role)) {
    return { error: '仅支持学校联系人和家长角色自助注册' };
  }

  for (const [, u] of db.users) {
    if (u.username === username) {
      return { error: '用户名已存在' };
    }
    if (u.email === email) {
      return { error: '邮箱已被注册' };
    }
  }

  const id = db.getNextId(db.users);
  const now = new Date().toISOString();
  const user = {
    id,
    username,
    email,
    password_hash: bcrypt.hashSync(password, 10),
    role,
    name,
    phone,
    created_at: now,
    updated_at: now,
  };
  db.users.set(id, user);

  const { password_hash, ...userWithoutHash } = user;
  return { data: userWithoutHash };
}

export function login(username: string, password: string) {
  let foundUser = null;
  for (const [, u] of db.users) {
    if (u.username === username) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    return { error: '用户名或密码错误' };
  }

  if (!bcrypt.compareSync(password, foundUser.password_hash)) {
    return { error: '用户名或密码错误' };
  }

  const token = jwt.sign(
    { userId: foundUser.id, role: foundUser.role, username: foundUser.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password_hash, ...userWithoutHash } = foundUser;
  return { data: { token, user: userWithoutHash } };
}
