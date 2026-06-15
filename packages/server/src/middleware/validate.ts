import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now();
  _res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[HTTP] ${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`
    );
  });
  next();
}

export function validateRequest<T>(schema: {
  parse: (data: unknown) => T;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
