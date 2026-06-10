const { error } = require('../utils/response');

function notFound(req, res, next) {
  return error(res, '请求的资源不存在', 404);
}

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.code === 'P2002') {
    return error(res, '数据已存在，请勿重复提交', 400);
  }

  if (err.code === 'P2025') {
    return error(res, '记录不存在', 404);
  }

  if (err.code === 'P2003') {
    return error(res, '关联数据不存在', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  return error(res, message, statusCode);
}

module.exports = {
  notFound,
  errorHandler,
};
