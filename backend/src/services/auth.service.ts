import { db } from '../database/db';
import bcrypt from 'bcryptjs';
import { logAudit } from '../utils/audit';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export class AuthService {
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (e) {
      return null;
    }
  }

  async login(username: string, password: string, ipAddress: string = '127.0.0.1', userAgent: string = ''): Promise<any> {
    const user = await db('users').where({ username }).first();
    
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;

    await logAudit(
      user.id,
      'login',
      'auth',
      user.id,
      null,
      { success: true },
      ipAddress,
      userAgent
    );

    return {
      token: this.generateToken(user),
      user: userWithoutPassword
    };
  }

  private generateToken(user: any): string {
    return (jwt as any).sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        name: user.name 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  async logout(userId: string, ipAddress: string = '127.0.0.1', userAgent: string = ''): Promise<void> {
    await logAudit(
      userId,
      'logout',
      'auth',
      userId,
      null,
      null,
      ipAddress,
      userAgent
    );
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await db('users')
      .select('id', 'username', 'name', 'role', 'phone', 'points', 'created_at')
      .where({ id: userId })
      .first();
    
    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      throw new Error('用户不存在');
    }

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      throw new Error('原密码错误');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db('users')
      .where({ id: userId })
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date()
      });

    return true;
  }
}
