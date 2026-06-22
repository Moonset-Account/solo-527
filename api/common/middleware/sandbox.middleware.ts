import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      isSandbox: boolean;
    }
  }
}

@Injectable()
export class SandboxMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const sandboxHeader = req.headers['x-sandbox-mode'];
    req.isSandbox = sandboxHeader === 'true' || sandboxHeader === '1';
    next();
  }
}

export function sandboxMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const sandboxHeader = req.headers['x-sandbox-mode'];
  req.isSandbox = sandboxHeader === 'true' || sandboxHeader === '1';
  next();
}
