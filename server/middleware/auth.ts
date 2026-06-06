import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../../app/types/index.js";

declare module "express-session" {
  interface SessionData {
    userId: string;
    user: {
      id: string;
      username: string;
      real_name: string;
      role: UserRole;
      region?: string;
    };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
}

export function getCurrentUser(req: Request) {
  return req.session.user || null;
}

export function getUserId(req: Request): string | null {
  return req.session.userId || null;
}
