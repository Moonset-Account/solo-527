import { Response } from 'express';

export function successResponse<T>(res: Response, data: T, message: string = '操作成功') {
  return res.json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res: Response, message: string, statusCode: number = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}

export function paginatedResponse<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message: string = '查询成功'
) {
  return res.json({
    success: true,
    message,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
