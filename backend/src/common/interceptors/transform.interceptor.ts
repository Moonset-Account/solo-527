import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - now;
        this.logger.debug(
          `${request.method} ${request.url} - Status: 200 - Duration: ${duration}ms`,
        );

        if (data && typeof data === 'object' && 'success' in data) {
          return data as any;
        }

        return {
          success: true,
          code: 200,
          message: '操作成功',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
