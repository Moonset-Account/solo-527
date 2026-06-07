import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'sports-training-dashboard-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    athleteId?: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      athleteId?: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

export function generateToken(user: {
  id: string;
  email: string;
  role: string;
  athleteId?: string;
}) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, athleteId: user.athleteId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function checkAthleteAccess(
  req: AuthRequest,
  athleteId: string
): Promise<boolean> {
  if (!req.user) return false;
  if (req.user.role === 'coach' || req.user.role === 'admin') {
    return true;
  }
  return req.user.athleteId === athleteId;
}
