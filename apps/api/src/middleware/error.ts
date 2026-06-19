import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `路由不存在: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err.message, err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || '服务器内部错误',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}
