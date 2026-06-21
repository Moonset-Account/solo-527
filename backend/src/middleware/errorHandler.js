const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('错误:', err);

  if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002':
        const target = err.meta?.target || '数据';
        return res.status(400).json(error(`${target}已存在`, 400));
      case 'P2025':
        return res.status(404).json(error('记录不存在', 404));
      case 'P2003':
        return res.status(400).json(error('关联数据不存在', 400));
      default:
        return res.status(400).json(error('数据库操作失败', 400));
    }
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json(error(err.message || '参数验证失败', 400));
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json(error(err.message, err.statusCode));
  }

  const statusCode = err.status || err.code || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json(error(message, statusCode));
}

function notFound(req, res, next) {
  res.status(404).json(error('接口不存在', 404));
}

module.exports = {
  errorHandler,
  notFound,
};
