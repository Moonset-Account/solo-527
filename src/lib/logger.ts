import pino from 'pino';
import prisma from './prisma';

const transport = process.env.NODE_ENV === 'development'
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    })
  : undefined;

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: 'wedding-planner',
    },
  },
  transport
);

export interface ErrorLogInput {
  message: string;
  stack?: string;
  userId?: string;
  path?: string;
  method?: string;
  status?: number;
}

export async function logErrorToDatabase(input: ErrorLogInput): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        message: input.message,
        stack: input.stack,
        userId: input.userId,
        path: input.path,
        method: input.method,
        status: input.status,
      },
    });
  } catch (dbError) {
    logger.error('Failed to log error to database:', dbError);
  }
}

export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: Record<string, any>
) {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | { error: string }> => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error as Error;
      logger.error({ err, context }, 'Unhandled error');
      
      await logErrorToDatabase({
        message: err.message,
        stack: err.stack,
        ...context,
      });

      throw error;
    }
  };
}
