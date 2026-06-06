import 'express';
import 'express-session';

declare module 'express' {
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

declare module 'express-session' {
  interface SessionData {
    token?: string;
    userId?: string;
  }
}
