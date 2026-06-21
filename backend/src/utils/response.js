function success(...args) {
  let res, data, message, statusCode;

  if (args[0] && typeof args[0].json === 'function') {
    res = args[0];
    data = args[1];
    message = args[2] || '操作成功';
    statusCode = args[3] || 200;
  } else {
    data = args[0] !== undefined ? args[0] : null;
    message = args[1] || '操作成功';
    statusCode = 200;
  }

  const result = {
    code: statusCode,
    message,
    data,
    success: true,
  };

  if (res) {
    return res.status(statusCode).json(result);
  }
  return result;
}

function error(...args) {
  let res, message, code;

  if (args[0] && typeof args[0].json === 'function') {
    res = args[0];
    message = args[1] || '操作失败';
    code = args[2] || 400;
  } else {
    message = args[0] || '操作失败';
    code = args[1] || 400;
  }

  const result = {
    code,
    message,
    data: null,
    success: false,
  };

  if (res) {
    return res.status(code).json(result);
  }
  return result;
}

function paginate(...args) {
  let res, list, total, page, pageSize;

  if (args[0] && typeof args[0].json === 'function') {
    res = args[0];
    list = args[1] || [];
    total = args[2] || 0;
    page = args[3] || 1;
    pageSize = args[4] || 10;
  } else {
    list = args[0] || [];
    total = args[1] || 0;
    page = args[2] || 1;
    pageSize = args[3] || 10;
  }

  const result = {
    code: 200,
    message: '查询成功',
    success: true,
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    },
  };

  if (res) {
    return res.status(200).json(result);
  }
  return result;
}

module.exports = {
  success,
  error,
  paginate,
};
