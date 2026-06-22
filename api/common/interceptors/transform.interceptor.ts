import { Injectable } from '@nestjs/common';
import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          typeof (data as { success?: unknown }).success === 'boolean'
        ) {
          return data as unknown as ApiResponse<T>;
        }

        return {
          success: true,
          data: data !== undefined ? data : null,
          message: 'Success',
        };
      }),
    );
  }
}
