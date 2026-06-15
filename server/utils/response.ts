export function successResponse(data: any, message = '操作成功') {
  return {
    code: 200,
    message,
    data
  }
}

export function errorResponse(message: string, code = 400) {
  return {
    code,
    message,
    data: null
  }
}

export function paginatedResponse(list: any[], total: number, page: number, pageSize: number) {
  return {
    code: 200,
    message: '查询成功',
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}
