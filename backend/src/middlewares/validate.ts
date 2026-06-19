import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export function validateRequest(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map((e: any) => {
      const field = e.path || e.param;
      return `${field ? field + ': ' : ''}${e.msg}`;
    });
    const message = errorList.join('; ');
    throw new ValidationError(
      message,
      '请修正表单中的错误后重试'
    );
  }
  next();
}
