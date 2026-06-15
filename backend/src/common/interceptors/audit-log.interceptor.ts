import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';
import { AuditLogService } from '../services/audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditLogOptions = this.reflector.get<AuditLogOptions>(AUDIT_LOG_KEY, context.getHandler());
    if (!auditLogOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, params, body, query, ip, headers } = request;

    return next.handle().pipe(
      tap((response) => {
        this.auditLogService.create({
          action: auditLogOptions.action,
          entityType: auditLogOptions.entityType,
          entityId: params?.id || body?.id,
          userId: request.user?.id,
          username: request.user?.username,
          description: auditLogOptions.description,
          oldValues: {},
          newValues: body,
          changedFields: Object.keys(body || {}),
          ipAddress: ip,
          userAgent: headers['user-agent'],
          metadata: { method, params, query, statusCode: response?.statusCode },
        });
      }),
    );
  }
}
