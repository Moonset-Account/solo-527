export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: '数据验证失败', details: errors });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ error: '无效的ID格式' });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ error: '数据已存在', details: Object.keys(err.keyPattern) });
  }
  
  if (err.message?.includes('File too large')) {
    return res.status(400).json({ error: '文件大小超出限制' });
  }
  
  res.status(500).json({ error: '服务器内部错误' });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: '接口不存在' });
};
