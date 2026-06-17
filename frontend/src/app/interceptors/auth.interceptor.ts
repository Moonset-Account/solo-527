import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('accessToken');
    let cloned = req.clone({ setHeaders: { 'Accept-Language': 'zh-CN' } });
    if (token && req.url.startsWith('/api/')) {
      cloned = cloned.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return next.handle(cloned).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 403) {
          if (this.router.url.startsWith('/admin')) {
            localStorage.removeItem('accessToken');
            this.router.navigate(['/admin/login']);
          }
        }
        return throwError(() => err);
      })
    );
  }
}
