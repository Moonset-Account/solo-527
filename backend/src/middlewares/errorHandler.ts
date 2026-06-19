import { Request, Response, NextFunction } from 'express';
import { error, ErrorCodes, ErrorMessages } from '../utils/response';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let code = ErrorCodes.INTERNAL_ERROR;
  let message = err.message || ErrorMessages[code].message;
  let suggestion = err.suggestion || ErrorMessages[code].suggestion;

  if (err instanceof AppError) {
    code = err.code;
    message = err.message;
    if (err.suggestion) suggestion = err.suggestion;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        code = ErrorCodes.CONFLICT;
        message = `数据重复：${(err.meta?.target as string[] || []).join(', ')}字段已存在`;
        suggestion = '请使用不同的值重试，或检查是否重复提交';
        break;
      case 'P2003':
        code = ErrorCodes.BAD_REQUEST;
        message = '关联数据不存在或无效';
        suggestion = '请检查相关数据是否存在或有效';
        break;
      case 'P2025':
        code = ErrorCodes.NOT_FOUND;
        message = '操作的记录不存在';
        suggestion = '该记录可能已被删除，请刷新后重试';
        break;
      case 'P2014':
        code = ErrorCodes.CONFLICT;
        message = '该数据有关联引用，无法删除';
        suggestion = '请先删除关联的数据，或联系管理员处理';
        break;
      default:
        code = ErrorCodes.BAD_REQUEST;
        message = `数据库操作失败：${err.code}`;
        suggestion = '请检查数据是否合法，或稍后重试';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    code = ErrorCodes.VALIDATION_ERROR;
    message = '数据格式验证失败';
    suggestion = '请检查输入字段的类型和格式是否正确';
  } else if (err.name === 'TokenExpiredError') {
    code = ErrorCodes.UNAUTHORIZED;
    message = '登录状态已过期';
    suggestion = '请重新登录以继续操作';
  } else if (err.name === 'JsonWebTokenError') {
    code = ErrorCodes.UNAUTHORIZED;
    message = '登录凭证无效';
    suggestion = '请重新登录，或清除浏览器缓存后重试';
  } else if (err.type === 'entity.parse.failed') {
    code = ErrorCodes.BAD_REQUEST;
    message = '请求体格式错误';
    suggestion = '请确保发送的是有效的JSON格式';
  }

  const traceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', {
      code,
      message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      traceId,
    });
  }

  res.status(code >= 500 ? 500 : code).json(
    error(code, message, suggestion, traceId)
  );
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  const err = new AppError(
    ErrorCodes.NOT_FOUND,
    `接口不存在：${req.method} ${req.originalUrl}`,
    '请检查接口路径是否正确，或查看API文档'
  );
  next(err);
}
