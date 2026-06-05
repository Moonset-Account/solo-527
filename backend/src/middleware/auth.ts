import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../types';

export interface AuthRequest extends FastifyRequest {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export function authenticate(requiredRoles?: UserRole[]) {
  return async (request: AuthRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return reply.status(401).send({ error: '未提供认证令牌' });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return reply.status(401).send({ error: '认证令牌无效或已过期' });
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(payload.role)) {
        return reply.status(403).send({ error: '权限不足' });
      }
    }

    request.user = payload;
  };
}

export function getClientIp(request: FastifyRequest): string {
  return (request.ip || 
    request.headers['x-forwarded-for'] as string || 
    request.headers['x-real-ip'] as string || 
    '127.0.0.1').split(',')[0].trim();
}
