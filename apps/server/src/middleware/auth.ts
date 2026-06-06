import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    realName: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const result = await query(
      'SELECT id, username, real_name, role, is_frozen FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    const user = result.rows[0];
    
    if (user.is_frozen) {
      return res.status(403).json({ error: '账户已被冻结', reason: user.frozen_reason });
    }
    
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      realName: user.real_name,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: '认证令牌无效' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
};

export type { AuthRequest };
