import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../entities/User';
import { AppDataSource } from '../database/data-source';

const JWT_SECRET = process.env.JWT_SECRET || 'campus-recruitment-secret-key-2024';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: decoded.userId });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: '用户不存在或已禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '认证令牌无效或已过期' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: '未登录' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }
    
    next();
  };
}
