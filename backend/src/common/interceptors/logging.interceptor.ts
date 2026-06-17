import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
    return next.handle().pipe(
      tap(() => {
        console.log(`[${new Date().toISOString()}] Completed in ${Date.now() - now}ms`);
      }),
    );
  }
}
