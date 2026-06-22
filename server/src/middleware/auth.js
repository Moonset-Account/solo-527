import { verifyToken } from '../utils/jwt.js';
import { error } from '../utils/response.js';
import prisma from '../config/prisma.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(error('未登录或登录已过期', 401));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json(error('登录凭证无效', 401));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json(error('用户不存在', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json(error('服务器内部错误', 500));
  }
}

export function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(error('未登录', 401));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(error('权限不足', 403));
    }

    next();
  };
}
