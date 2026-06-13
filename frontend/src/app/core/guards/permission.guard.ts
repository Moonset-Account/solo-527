import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredPermission = route.data['permission'];

    if (!requiredPermission) {
      return true;
    }

    if (this.authService.hasPermission(requiredPermission)) {
      return true;
    }

    this.snackBar.open('您没有权限访问此页面', '关闭', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });

    this.router.navigate(['/dashboard']);
    return false;
  }
}
