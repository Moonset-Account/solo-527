import { query } from '../db/index.ts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.session?.token;
  
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const result = await query(
      'SELECT id, username, full_name, role, store_id, region_id FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }
}

export function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未授权访问' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

export async function checkStoreAccess(req, res, next) {
  const { storeId } = req.params;
  const user = req.user;
  
  if (user.role === 'regional_manager') {
    return next();
  }
  
  if (user.role === 'store_manager' && user.store_id === storeId) {
    return next();
  }
  
  if (user.role === 'supervisor') {
    return next();
  }
  
  return res.status(403).json({ error: '无权限访问该门店' });
}

export async function checkIssueAccess(req, res, next) {
  const { issueId } = req.params;
  const user = req.user;
  
  try {
    const result = await query('SELECT store_id FROM issues WHERE id = $1', [issueId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '问题不存在' });
    }
    
    const issue = result.rows[0];
    
    if (user.role === 'regional_manager') {
      return next();
    }
    
    if (user.role === 'store_manager' && user.store_id === issue.store_id) {
      return next();
    }
    
    if (user.role === 'supervisor') {
      return next();
    }
    
    return res.status(403).json({ error: '无权限访问该问题' });
  } catch (error) {
    next(error);
  }
}
