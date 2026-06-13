export class AppError extends Error {
  code: string
  message: string
  detail?: string
  statusCode: number

  constructor(code: string, message: string, statusCode: number, detail?: string) {
    super(message)
    this.code = code
    this.message = message
    this.statusCode = statusCode
    this.detail = detail
  }
}

const errorMap: Record<string, { message: string; statusCode: number }> = {
  AUTH_FAILED: { message: '用户名或密码不正确，请检查后重新输入', statusCode: 401 },
  TOKEN_EXPIRED: { message: '登录已过期，请重新登录后再操作', statusCode: 401 },
  FORBIDDEN: { message: '您没有权限执行此操作，请联系管理员申请权限', statusCode: 403 },
  NOT_FOUND: { message: '请求的内容不存在或已被删除，请刷新后重试', statusCode: 404 },
  VALIDATION_ERROR: { message: '提交的数据有误', statusCode: 400 },
  DUPLICATE_ENTRY: { message: '该记录已存在，请勿重复提交', statusCode: 409 },
  INTERNAL_ERROR: { message: '服务器内部错误，请稍后重试或联系技术支持', statusCode: 500 },
  PERMISSION_DENIED: { message: '无权限操作，该功能仅管理员可用', statusCode: 403 },
  INVALID_STATE: { message: '当前状态不允许此操作', statusCode: 400 },
  ALREADY_CONFIRMED: { message: '该告警已被他人确认，请刷新后查看', statusCode: 409 },
  ALREADY_PROCESSED: { message: '该申请已处理，请勿重复审批', statusCode: 409 },
  ASSET_REQUIRED_AUDIT: { message: '涉及资产变更，操作将被记录', statusCode: 400 },
  DUTY_NOT_FOUND: { message: '未找到对应日期的值班人员', statusCode: 404 },
  NETWORK_ERROR: { message: '网络连接失败，请检查网络后重试', statusCode: 0 },
  PARSE_ERROR: { message: '服务器返回数据格式异常，请联系技术支持', statusCode: 500 },
  RECORD_NOT_FOUND: { message: '记录不存在或已被删除', statusCode: 404 },
  STATUS_CONFLICT: { message: '状态冲突，请刷新后重试', statusCode: 409 },
  INSUFFICIENT_PERMISSION: { message: '权限不足，需要管理员权限', statusCode: 403 },
  MISSING_REQUIRED_FIELD: { message: '缺少必填字段，请检查后重新提交', statusCode: 400 },
  INVALID_PARAMETER: { message: '参数格式不正确，请检查后重新提交', statusCode: 400 },
  OPERATION_TOO_FREQUENT: { message: '操作过于频繁，请稍后再试', statusCode: 429 },
  SERVER_MAINTENANCE: { message: '系统维护中，请稍后再试', statusCode: 503 },
  DATA_INTEGRITY_ERROR: { message: '数据完整性错误，请联系技术支持', statusCode: 500 },
  CONCURRENT_MODIFICATION: { message: '数据已被他人修改，请刷新后重试', statusCode: 409 },
}

export function createError(code: string, detail?: string): AppError {
  const entry = errorMap[code] || errorMap.INTERNAL_ERROR
  return new AppError(code, entry.message, entry.statusCode, detail)
}
