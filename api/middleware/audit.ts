import { type Request, type Response, type NextFunction } from 'express'
import AuditLog from '../models/AuditLog.js'

const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!WRITE_METHODS.includes(req.method.toUpperCase())) {
    next()
    return
  }

  const originalEnd = res.end.bind(res)

  res.end = function (this: Response, ...args: any[]) {
    const operatorId = req.headers['x-operator-id'] as string || ''
    const operatorName = req.headers['x-operator-name'] as string || ''
    const pathParts = req.path.split('/').filter(Boolean)
    const module = pathParts[0] || 'unknown'

    let targetId = ''
    if (pathParts.length > 1) {
      targetId = pathParts[pathParts.length - 1]
    }

    const targetType = pathParts[0] || ''

    const detail = JSON.stringify({
      method: req.method,
      path: req.path,
      body: req.method !== 'GET' ? req.body : undefined,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
    })

    AuditLog.create({
      action: req.method.toUpperCase(),
      module,
      operatorId,
      operatorName,
      targetId,
      targetType,
      detail,
      ipAddress: req.ip || req.socket.remoteAddress || '',
    }).catch((err) => {
      console.error('Audit log creation failed:', err)
    })

    return originalEnd.apply(res, args)
  } as any

  next()
}
