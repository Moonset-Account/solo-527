import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '发生未知错误';

        if (error.error instanceof ErrorEvent) {
          errorMessage = `客户端错误: ${error.error.message}`;
        } else {
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || '请求参数错误';
              break;
            case 401:
              errorMessage = '未授权，请重新登录';
              this.authService.logout();
              this.router.navigate(['/login']);
              break;
            case 403:
              errorMessage = '没有权限执行此操作';
              break;
            case 404:
              errorMessage = '请求的资源不存在';
              break;
            case 409:
              errorMessage = error.error?.message || '数据冲突';
              break;
            case 422:
              errorMessage = error.error?.message || '数据验证失败';
              break;
            case 500:
              errorMessage = '服务器内部错误';
              break;
            case 503:
              errorMessage = '服务不可用，请稍后重试';
              break;
            default:
              errorMessage = error.error?.message || `错误代码: ${error.status}`;
          }
        }

        this.snackBar.open(errorMessage, '关闭', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });

        return throwError(() => error);
      })
    );
  }
}
