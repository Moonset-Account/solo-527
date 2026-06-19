export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  suggestion?: string;
  traceId?: string;
}

export function success<T>(data?: T, message: string = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
  };
}

export function error(
  code: number,
  message: string,
  suggestion?: string,
  traceId?: string
): ApiResponse {
  return {
    code,
    message,
    suggestion,
    traceId,
  };
}

export const ErrorCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ErrorMessages: Record<number, { message: string; suggestion: string }> = {
  [ErrorCodes.BAD_REQUEST]: {
    message: '请求参数错误',
    suggestion: '请检查输入参数是否正确，或联系技术支持',
  },
  [ErrorCodes.UNAUTHORIZED]: {
    message: '身份验证失败',
    suggestion: '请重新登录或检查登录凭证是否过期',
  },
  [ErrorCodes.FORBIDDEN]: {
    message: '没有权限执行此操作',
    suggestion: '请联系管理员获取相应权限',
  },
  [ErrorCodes.NOT_FOUND]: {
    message: '请求的资源不存在',
    suggestion: '请确认资源ID是否正确，或该资源可能已被删除',
  },
  [ErrorCodes.CONFLICT]: {
    message: '数据冲突',
    suggestion: '数据可能已被修改，请刷新后重试',
  },
  [ErrorCodes.VALIDATION_ERROR]: {
    message: '数据验证失败',
    suggestion: '请检查必填项是否填写完整，格式是否正确',
  },
  [ErrorCodes.INTERNAL_ERROR]: {
    message: '服务器内部错误',
    suggestion: '请稍后重试，如问题持续请联系技术支持并提供错误时间',
  },
  [ErrorCodes.SERVICE_UNAVAILABLE]: {
    message: '服务暂时不可用',
    suggestion: '系统维护中，请稍后再试，或查看公告了解具体时间',
  },
};
