import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PATCH: 'UPDATE',
      PUT: 'UPDATE',
      DELETE: 'DELETE',
    };

    const action = actionMap[method];
    if (!action) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        const entityType = context.getClass().name.replace('Controller', '').toUpperCase();
        const entityId = request.params?.id || response?.id;
        const body = request.body;

        const details: any = {
          method,
          url: request.url,
        };

        if (body?.responsiblePerson !== undefined) {
          details.responsiblePersonChanged = true;
          details.operatorName = body.operatorName;
          details.reason = body.reason;
        }

        const log = this.auditLogRepository.create({
          operator: user.id,
          operatorName: user.displayName || user.username,
          action,
          entityType,
          entityId: entityId || null,
          details,
          ipAddress: request.ip || request.connection?.remoteAddress,
        });

        await this.auditLogRepository.save(log);
      }),
    );
  }
}
