import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { User, UserRole } from '../types';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  password: z.string().min(6, '密码至少6个字符')
});

export class AuthService {
  async login(username: string, password: string, ipAddress: string = '127.0.0.1'): Promise<{
    user: Omit<User, 'password_hash'>;
    token: string;
  } | null> {
    const validation = loginSchema.safeParse({ username, password });
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const user = await db('users').where({ username }).first();
    
    if (!user) {
      await logAudit(null, 'login_failed', 'auth', null, null, { username }, ipAddress);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      await logAudit(user.id, 'login_failed', 'auth', user.id, null, { username }, ipAddress);
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    
    await logAudit(user.id, 'login_success', 'auth', user.id, null, null, ipAddress);
    
    return {
      user: userWithoutPassword,
      token: this.generateToken(user)
    };
  }

  async getCurrentUser(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await db('users').where({ id: userId }).first();
    if (!user) return null;
    
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private generateToken(user: User): string {
    const payload = Buffer.from(JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000
    })).toString('base64');
    return payload;
  }

  static verifyToken(token: string): { id: string; role: UserRole; username: string } | null {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      if (payload.exp < Date.now()) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}
