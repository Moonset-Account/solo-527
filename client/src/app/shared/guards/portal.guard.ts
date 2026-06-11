import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivatedRouteSnapshot } from '@angular/router';

export const portalGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = route.paramMap.get('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isAuthenticated() && authService.getUserRole() === 'customer') {
    return true;
  }

  return authService.portalLogin(token).pipe(
    map(() => true),
    switchMap(() => of(true))
  );
};
