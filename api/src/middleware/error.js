export const notFound = (req, res) => {
  res.status(404).json({ error: `路由不存在: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);
  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : err.code === 11000 ? 409 : 500);
  let message = err.message || '服务器内部错误';
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join('; ');
  }
  if (err.code === 11000) {
    message = '数据重复，已存在相同记录';
  }
  res.status(status).json({ error: message });
};
