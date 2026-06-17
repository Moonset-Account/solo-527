const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      errors: err.errors || err.message,
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      const target = err.meta?.target || [];
      return res.status(400).json({
        code: 400,
        message: `${target.join(', ')} 已存在`,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        code: 404,
        message: '记录不存在',
      });
    }
  }

  if (err.name === 'ZodError') {
    const errors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors,
    });
  }

  res.status(err.statusCode || 500).json({
    code: err.statusCode || 500,
    message: err.message || '服务器内部错误',
  });
};

module.exports = errorHandler;
