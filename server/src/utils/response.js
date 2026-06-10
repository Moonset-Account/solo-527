function success(res, data = null, message = '操作成功') {
  return res.json({
    code: 200,
    message,
    data,
  });
}

function error(res, message = '操作失败', code = 500) {
  return res.status(code).json({
    code,
    message,
    data: null,
  });
}

function paginate(res, data, total, page, pageSize, message = '获取成功') {
  return res.json({
    code: 200,
    message,
    data: {
      list: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

module.exports = {
  success,
  error,
  paginate,
};
