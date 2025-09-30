import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (roles: string[]): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const ok = authService.hasAnyRole(roles);
  if (!ok) router.navigate(['/']);
  return ok;
};
