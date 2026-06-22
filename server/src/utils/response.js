export function success(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data,
  };
}

export function error(message = 'error', code = 1) {
  return {
    code,
    message,
    data: null,
  };
}

export function paginate(list, total, page, pageSize) {
  return {
    list,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / pageSize),
  };
}
