import type { Request, Response, NextFunction } from 'express'
import AuditLog from '../models/AuditLog.js'

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const logEntry = {
    userId: req.user?.userId,
    action: `${req.method} ${req.path}`,
    module: req.path.split('/')[2] || 'unknown',
    detail: `method=${req.method} path=${req.path}`,
  }

  AuditLog.create(logEntry).catch(() => {})

  next()
}
