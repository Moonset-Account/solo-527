import { fail } from '../utils/response.js';

export function notFound(_req, res) {
  return fail(res, `接口不存在`, 404);
}

export function errorHandler(err, _req, res, _next) {
  console.error('❌ API Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002':
        return fail(res, `数据重复，字段: ${err.meta?.target?.join(', ') || '唯一约束'}`, 400);
      case 'P2003':
        return fail(res, '关联数据不存在，请检查引用', 400);
      case 'P2025':
        return fail(res, '记录不存在或已被删除', 404);
      default:
        return fail(res, `数据库错误 (${err.code})`, 500);
    }
  }

  if (err.name === 'ZodError' || err.name === 'ValidationError') {
    return fail(res, err.message || '数据校验失败', 400, err.errors || err.details);
  }

  if (err.status === 400 || err.statusCode === 400) {
    return fail(res, err.message || '请求参数错误', 400);
  }

  return fail(res, err.message || '服务器内部错误', err.status || 500);
}
