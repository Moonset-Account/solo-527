import { type Request, type Response, type NextFunction } from 'express';
import type { UserRole } from '../../shared/types.js';

declare global {
  namespace Express {
    interface Request {
      userRole: UserRole;
      userDepartment?: string;
      userId?: string;
    }
  }
}

export function permissionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const roleHeader = req.headers['x-user-role'] as string | undefined;
  const departmentHeader = req.headers['x-department'] as string | undefined;
  const userIdHeader = req.headers['x-user-id'] as string | undefined;

  if (!roleHeader) {
    req.userRole = 'hr_admin';
    next();
    return;
  }

  const role = roleHeader as UserRole;
  if (!['hr_admin', 'recruiting_manager', 'interviewer'].includes(role)) {
    res.status(403).json({ success: false, error: 'Invalid role' });
    return;
  }

  req.userRole = role;
  req.userDepartment = departmentHeader;
  req.userId = userIdHeader;

  if (role === 'interviewer') {
    const allowedPaths = ['/api/workload'];
    if (!allowedPaths.some(p => req.path.startsWith(p))) {
      res.status(403).json({ success: false, error: 'Interviewers can only access workload endpoint' });
      return;
    }
  }

  next();
}
