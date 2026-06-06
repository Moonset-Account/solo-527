import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        full_name: string;
        role: 'supervisor' | 'store_manager' | 'regional_manager';
        store_id: string | null;
        region_id: string | null;
      };
    }
  }

  module 'express-session' {
    interface SessionData {
      token?: string;
      userId?: string;
    }
  }
}

export type ExpressRequest = Request;
export type ExpressResponse = Response;
export type ExpressNext = NextFunction;
