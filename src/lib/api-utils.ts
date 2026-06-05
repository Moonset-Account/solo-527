import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { hasPermission, canAccessProject, type Permission } from './permissions';
import { logErrorToDatabase, logger } from './logger';
import { z, ZodSchema } from 'zod';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function createApiHandler<T = any>(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<T>>,
    context: {
      userId: string;
      role: string;
      session: any;
    }
  ) => Promise<void> | void,
  options?: {
    requirePermission?: Permission;
    requireProjectAccess?: boolean;
    schema?: ZodSchema;
  }
) {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse<T>>) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: '请先登录',
        });
      }

      const { id: userId, role } = session.user;

      if (options?.requirePermission) {
        if (!hasPermission(role as any, options.requirePermission)) {
          logger.warn({ userId, permission: options.requirePermission }, 'Permission denied');
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: '没有权限执行此操作',
          });
        }
      }

      if (options?.requireProjectAccess) {
        const projectId = req.query.projectId as string || req.body?.projectId;
        if (projectId) {
          const canAccess = await canAccessProject(userId, role as any, projectId);
          if (!canAccess) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden',
              message: '没有权限访问此项目',
            });
          }
        }
      }

      if (options?.schema && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        try {
          options.schema.parse(req.body);
        } catch (validationError) {
          const err = validationError as z.ZodError;
          return res.status(400).json({
            success: false,
            error: 'ValidationError',
            message: '请求数据格式错误',
            data: err.errors as any,
          });
        }
      }

      await handler(req, res, { userId, role, session });
    } catch (error) {
      const err = error as Error;
      logger.error({ err, method: req.method, path: req.url }, 'API Error');
      
      await logErrorToDatabase({
        message: err.message,
        stack: err.stack,
        path: req.url,
        method: req.method,
      });

      return res.status(500).json({
        success: false,
        error: 'InternalServerError',
        message: '服务器内部错误',
      });
    }
  };
}
