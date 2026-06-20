import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { OperationAction } from '../types/enums';

interface LogOptions {
  action: OperationAction;
  targetType: string;
  targetId?: number | null;
  targetName?: string | null;
  memberId?: number | null;
  detail?: string | null;
  oldValue?: any;
  newValue?: any;
}

export async function createOperationLog(
  req: Request,
  options: LogOptions
) {
  try {
    const operatorId = req.user?.id;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.ip ||
      undefined;
    const userAgent = req.headers['user-agent'];

    await prisma.operationLog.create({
      data: {
        operatorId,
        memberId: options.memberId,
        action: options.action,
        targetType: options.targetType,
        targetId: options.targetId ?? undefined,
        targetName: options.targetName ?? undefined,
        oldValue: options.oldValue ? JSON.stringify(options.oldValue) : undefined,
        newValue: options.newValue ? JSON.stringify(options.newValue) : undefined,
        detail: options.detail ?? undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error('创建操作日志失败', err);
  }
}

export function operationLogger(optionsFactory: (req: Request, res: Response) => LogOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const options = optionsFactory(req, res);
        setImmediate(() => createOperationLog(req, options));
      }
      return originalSend.call(this, body);
    };
    next();
  };
}
