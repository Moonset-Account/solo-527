export class AppError extends Error {
  code: number;
  suggestion?: string;
  isOperational: boolean;

  constructor(
    code: number,
    message: string,
    suggestion?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.suggestion = suggestion;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = '请求参数错误', suggestion?: string) {
    super(400, message, suggestion || '请检查输入参数是否正确');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '身份验证失败', suggestion?: string) {
    super(401, message, suggestion || '请重新登录或检查登录凭证是否过期');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '没有权限执行此操作', suggestion?: string) {
    super(403, message, suggestion || '请联系管理员获取相应权限');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '请求的资源不存在', suggestion?: string) {
    super(404, message, suggestion || '请确认资源ID是否正确，或该资源可能已被删除');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '数据冲突', suggestion?: string) {
    super(409, message, suggestion || '数据可能已被修改，请刷新后重试');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = '数据验证失败', suggestion?: string) {
    super(422, message, suggestion || '请检查必填项是否填写完整，格式是否正确');
  }
}
