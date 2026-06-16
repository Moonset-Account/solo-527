const dayjs = require('dayjs');

const successResponse = (res, data, message = '操作成功') => {
  res.json({ success: true, data, message });
};

const errorResponse = (res, message = '操作失败', status = 400) => {
  res.status(status).json({ success: false, message });
};

const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format);
};

const generateRandomString = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const paginationQuery = (page = 1, pageSize = 10) => {
  const skip = (page - 1) * pageSize;
  return { skip, limit: parseInt(pageSize) };
};

module.exports = {
  successResponse,
  errorResponse,
  formatDate,
  generateRandomString,
  paginationQuery
};
