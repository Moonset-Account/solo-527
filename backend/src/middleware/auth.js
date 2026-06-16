import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { unauthorized, forbidden } from '../utils/response.js';

export function signToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    supplierId: user.supplierId || null,
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return null;
  }
}

export async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return unauthorized(res, '请先登录');

  const decoded = verifyToken(token);
  if (!decoded) return unauthorized(res, '登录已过期，请重新登录');

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { supplier: { select: { id: true, code: true, name: true } } },
    });

    if (!user || !user.isActive) {
      return unauthorized(res, '账号不存在或已被禁用');
    }

    req.user = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      email: user.email,
      phone: user.phone,
      supplierId: user.supplierId,
      supplier: user.supplier,
    };
    next();
  } catch (err) {
    console.error('auth middleware error:', err);
    return unauthorized(res, '认证失败');
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `需要以下角色之一: ${roles.join(', ')}`);
    }
    next();
  };
}

export const ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  PURCHASE_STAFF: 'PURCHASE_STAFF',
  QC_STAFF: 'QC_STAFF',
  SUPPLIER: 'SUPPLIER',
  VIEWER: 'VIEWER',
};

export const ALL_INTERNAL_ROLES = [
  ROLE.SUPER_ADMIN,
  ROLE.WAREHOUSE_MANAGER,
  ROLE.PURCHASE_STAFF,
  ROLE.QC_STAFF,
];

export const WRITE_ROLES = [
  ROLE.SUPER_ADMIN,
  ROLE.WAREHOUSE_MANAGER,
  ROLE.PURCHASE_STAFF,
  ROLE.QC_STAFF,
];
