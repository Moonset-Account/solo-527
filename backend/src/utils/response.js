export function success(res, data = null, message = 'success', status = 200) {
  return res.status(status).json({
    code: 0,
    success: true,
    message,
    data,
    timestamp: Date.now(),
  });
}

export function fail(res, message = '操作失败', status = 400, errors = null) {
  return res.status(status).json({
    code: 1,
    success: false,
    message,
    errors,
    data: null,
    timestamp: Date.now(),
  });
}

export function unauthorized(res, message = '未授权或登录已过期') {
  return fail(res, message, 401);
}

export function forbidden(res, message = '无权限执行此操作') {
  return fail(res, message, 403);
}

export function notFound(res, message = '资源不存在') {
  return fail(res, message, 404);
}

export function paginate(list, page, pageSize, total) {
  return {
    list,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(pageSize)),
    },
  };
}
