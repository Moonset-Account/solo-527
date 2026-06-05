import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import '../types.js';

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const originalSend = res.send;
    const userId = req.user?.userId || null;
    const action = req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : 'delete';
    const pathParts = req.path.split('/').filter(Boolean);
    const entityType = pathParts[0] || 'unknown';
    const entityId = pathParts[1] ? parseInt(pathParts[1], 10) || null : null;

    let oldValue: string | null = null;

    if (req.method === 'PUT' && entityId) {
      const storeMap = getStoreByEntityType(entityType);
      if (storeMap && entityId) {
        const existing = storeMap.get(entityId);
        if (existing) {
          oldValue = JSON.stringify(existing);
        }
      }
    }

    res.send = function (data: any): Response {
      const id = db.getNextId(db.auditLogs);
      db.auditLogs.set(id, {
        id,
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_value: oldValue,
        new_value: req.method !== 'DELETE' ? JSON.stringify(req.body) : null,
        ip_address: req.ip || '127.0.0.1',
        created_at: new Date().toISOString(),
      });

      return originalSend.call(this, data);
    };
  }
  next();
}

function getStoreByEntityType(entityType: string): Map<number, any> | null {
  const map: Record<string, Map<number, any>> = {
    courses: db.courses,
    sessions: db.sessions,
    bookings: db.bookings,
    'teaching-aids': db.teachingAids,
    scheduling: db.scheduleAssignments,
    users: db.users,
    schools: db.schools,
  };
  return map[entityType] || null;
}
