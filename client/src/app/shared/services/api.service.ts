import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(url: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<T>(`${API_URL}${url}`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(`${API_URL}${url}`, body).pipe(
      catchError(this.handleError)
    );
  }

  patch<T>(url: string, body: any): Observable<T> {
    return this.http.patch<T>(`${API_URL}${url}`, body).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`${API_URL}${url}`).pipe(
      catchError(this.handleError)
    );
  }

  upload<T>(url: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${API_URL}${url}`, formData).pipe(
      catchError(this.handleError)
    );
  }

  download(url: string, params?: Record<string, any>): Observable<Blob> {
    return this.http.get(`${API_URL}${url}`, { params, responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = '发生未知错误';
    if (error.status === 0) {
      message = '无法连接到服务器，请检查网络连接';
    } else if (error.status === 401) {
      message = '登录已过期，请重新登录';
    } else if (error.status === 403) {
      message = '您没有权限执行此操作';
    } else if (error.status === 404) {
      message = '请求的资源不存在';
    } else if (error.error?.message) {
      message = error.error.message;
    }
    return throwError(() => ({ message, status: error.status }));
  }
}
