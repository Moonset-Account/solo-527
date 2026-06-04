import { type Request, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database.js';
import { type AuthRequest } from './auth.js';

export function auditLog(entityType: string, action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send.bind(res);
    res.send = function (data: unknown): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const db = getDb();
          const entityId = req.params.id ? parseInt(req.params.id) : 0;
          let oldValue: string | undefined;
          let newValue: string | undefined;

          if (entityId && (action === 'update' || action === 'delete')) {
            try {
              const row = db.prepare(`SELECT * FROM ${entityType} WHERE id = ?`).get(entityId) as Record<string, unknown> | undefined;
              if (row) oldValue = JSON.stringify(row);
            } catch {}
          }

          if (action === 'create' || action === 'update') {
            newValue = JSON.stringify(req.body);
          }

          db.prepare(`
            INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(req.user?.id ?? null, entityType, entityId || 0, action, oldValue ?? null, newValue ?? null);
        } catch (err) {
          console.error('Audit log error:', err);
        }
      }
      return originalSend(data);
    };
    next();
  };
}
