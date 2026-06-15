import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const rolesGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data?.['roles'] as string[] | undefined;
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  const hasRole = requiredRoles.some((role) => authService.hasRole(role));
  if (hasRole) {
    return true;
  }
  router.navigate(['/dashboard']);
  return false;
};
